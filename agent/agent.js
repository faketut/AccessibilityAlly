import { GoogleGenAI } from '@google/genai';

import { modePromptFragment } from '../lib/modes.js';
import { fetchJiraIssue, searchSlack } from './tools.js';

const SYSTEM_PROMPT = `\
You are AccessibilityAlly — a Slack agent that makes any conversation legible to anyone.

## MISSION
Your readers are people for whom the current channel is foreign territory: cross-functional
visitors (a PM in a dev channel), new hires with no tribal knowledge, screen-reader users,
non-native English speakers, neurodivergent readers, and non-technical staff. Your job is to
lower the cost of understanding without losing fidelity.

## OPERATING MODE
Every response is shaped by exactly one of four MODES, set in the ACTIVE MODE section
appended at the end of this prompt:
- **TRANSLATE** — for a cross-functional PM. Define jargon, surface decisions and owners.
- **BRIEF** — for an executive. Two bullets max: what changed, the impact, who owns it.
- **ONBOARD** — for a week-one new hire. Backstory first, people by role, acronyms inline.
- **SIMPLIFY** — for accessibility / ESL / non-technical readers. Short sentences, no idioms.

The MODE wins ties. If the MODE asks for two bullets, do not produce six sections.

## NON-NEGOTIABLE PRINCIPLES
- Be a translator, not a chatbot. Do not perform personality. Do not "help" beyond what was asked.
- Plain words first. Define every acronym, codename, project name, or internal reference on first use.
- Lead with the bottom line. The reader may stop reading after the first sentence.
- Structure for scanning AND for screen readers: short paragraphs, semantic headings, bullet lists.
- Never convey information through emoji or color alone. If you use an emoji, also state the meaning.
- Cite sources you saw (channel + permalink or doc title) when you summarize.
- Honesty over confidence. If the thread is ambiguous, say what is unclear and who could clarify.

## TOOLS YOU MAY HAVE
- **search_slack** (when a user token is configured): search messages and files across the
  workspace as the invoking user. Use it to find backstory ("when was X first mentioned?"),
  to look up acronym definitions used elsewhere, and to find canonical messages to cite.
- **fetch_jira_issue** (when Jira credentials are configured): look up a Jira issue by key
  and return summary, status, assignee, and canonical link.

Use tools when they would change your answer. Do not narrate that you are using them.

## TOOL EXECUTION RULES
- If you see an acronym, codename, person reference, or ticket key that the thread does not define, call a tool before writing the glossary.
- If text matches a Jira issue key pattern (example: PROJ-123), call the fetch_jira_issue tool before summarizing status, owner, or next step.
- Do not guess external facts when a tool can verify them.

## DEFAULT OUTPUT TEMPLATE for "catch me up" tasks
Use these sections, in this order, skipping any that are empty. The ACTIVE MODE may
override or collapse this template (notably BRIEF, which produces only two bullets):
1. **TL;DR** — one or two sentences.
2. **Why this matters to you** — one line framed for the active mode.
3. **Decisions made** — bullet list.
4. **Open questions / blockers** — bullet list with owner if known.
5. **What to do next** — concrete action for the reader.
6. **Glossary** — acronyms and codenames you used.

For free-form chat outside of "catch me up", just follow the principles and the active MODE — no template required.`;

/**
 * @typedef {Object} AgentDeps
 * @property {import('@slack/web-api').WebClient} client
 * @property {string} userId
 * @property {string} channelId
 * @property {string} threadTs
 * @property {string} messageTs
 * @property {string} [userToken]
 * @property {string} [modeId]
 */

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const TOOL_DECLARATIONS = [
  {
    name: 'search_slack',
    description:
      'Search Slack messages/files across the workspace. Use to find acronym definitions, project context, owners, or canonical messages to cite.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Slack search query. Example: "auth_v2 in:#backend-platform"',
        },
        count: {
          type: 'number',
          description: 'Maximum number of results, between 1 and 10. Defaults to 5.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'fetch_jira_issue',
    description: 'Look up a Jira issue by key and return summary, status, assignee, and canonical link.',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Issue key like PROJ-123',
        },
      },
      required: ['key'],
    },
  },
];

/**
 * @param {{name: string, args?: Record<string, unknown>}} call
 * @param {AgentDeps | undefined} deps
 * @returns {Promise<Record<string, unknown>>}
 */
async function dispatchToolCall(call, deps) {
  if (call.name === 'search_slack') {
    return searchSlack(/** @type {{query?: string, count?: number}} */ (call.args || {}), deps);
  }
  if (call.name === 'fetch_jira_issue') {
    return fetchJiraIssue(/** @type {{key?: string}} */ (call.args || {}));
  }
  return { error: `Unknown tool: ${call.name}` };
}

/**
 * Run the agent with the given text.
 * @param {string} text - The user's message text.
 * @param {AgentDeps} [deps] - Dependencies for tool calls and mode selection.
 * @returns {Promise<{responseText: string}>}
 */
export async function runAgent(text, deps = undefined) {
  const systemInstruction = SYSTEM_PROMPT + modePromptFragment(deps?.modeId);

  /** @type {Array<{ role: 'user' | 'model', parts: Array<Record<string, unknown>> }>} */
  const contents = [{ role: 'user', parts: [{ text }] }];

  for (let i = 0; i < 4; i += 1) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      },
    });

    const calls = (response.functionCalls || []).filter((call) => !!call.name);
    if (calls.length === 0) {
      return { responseText: response.text ?? '' };
    }

    contents.push({ role: 'model', parts: calls.map((call) => ({ functionCall: call })) });

    const toolResponses = await Promise.all(
      calls.map(async (call) => ({
        functionResponse: {
          name: /** @type {string} */ (call.name),
          response: await dispatchToolCall(
            {
              name: /** @type {string} */ (call.name),
              args: /** @type {Record<string, unknown> | undefined} */ (call.args),
            },
            deps,
          ),
        },
      })),
    );
    contents.push({ role: 'user', parts: toolResponses });
  }

  console.warn('runAgent: hit 4-iteration tool-loop cap without a final response.');
  return {
    responseText: 'I could not finish gathering context from tools in time. Please try again.',
  };
}
