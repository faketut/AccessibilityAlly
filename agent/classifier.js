import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

/** @typedef {'resolved' | 'awaiting' | 'blocked' | 'discussion'} ThreadState */

const STATE_PROMPT = `Classify this Slack thread into exactly ONE of these states:

- "resolved": a decision was reached or the question was answered, no pending action.
- "awaiting": waiting on a specific person to reply, review, or decide.
- "blocked": progress is stuck on an external dependency, outage, or unresolved issue.
- "discussion": active back-and-forth, no specific action pending.

Reply with ONLY a JSON object of the form:
{"state": "<one-of-above>", "reason": "<one short sentence>", "owner": "<@user or empty string>"}`;

const STATE_LABELS = {
  resolved: { emoji: ':white_check_mark:', label: 'Resolved' },
  awaiting: { emoji: ':hourglass_flowing_sand:', label: 'Awaiting' },
  blocked: { emoji: ':warning:', label: 'Blocked' },
  discussion: { emoji: ':speech_balloon:', label: 'Discussion' },
};

/**
 * @param {string} threadText
 * @returns {Promise<{state: ThreadState, reason: string, owner: string}>}
 */
export async function classifyThread(threadText) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: [{ role: 'user', parts: [{ text: `${STATE_PROMPT}\n\n---\n${threadText}` }] }],
    config: { responseMimeType: 'application/json' },
  });
  const raw = (response.text ?? '').trim();
  try {
    const parsed = JSON.parse(raw);
    const state = /** @type {ThreadState} */ (
      ['resolved', 'awaiting', 'blocked', 'discussion'].includes(parsed.state) ? parsed.state : 'discussion'
    );
    return {
      state,
      reason: typeof parsed.reason === 'string' ? parsed.reason : '',
      owner: typeof parsed.owner === 'string' ? parsed.owner : '',
    };
  } catch {
    return { state: 'discussion', reason: '', owner: '' };
  }
}

/**
 * @param {{state: ThreadState, reason: string, owner: string}} result
 * @returns {{label: string, emoji: string, text: string}}
 */
export function formatStateBadge(result) {
  const { emoji, label } = STATE_LABELS[result.state];
  const ownerSuffix = result.owner ? ` · Owner: ${result.owner}` : '';
  const reasonSuffix = result.reason ? ` — ${result.reason}` : '';
  return {
    emoji,
    label,
    text: `${emoji} *${label}*${reasonSuffix}${ownerSuffix}`,
  };
}
