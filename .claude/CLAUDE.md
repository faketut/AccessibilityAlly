# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See the root `../.claude/CLAUDE.md` for monorepo-wide architecture, commands, and a comparison of all implementations.

## Agent specifics

**Agent (`agent/agent.js`)** uses `@google/genai` (`GoogleGenAI.models.generateContent`) with `gemini-2.0-flash`. The `runAgent(text, deps)` function runs a tool loop (up to 4 iterations) and returns `{ responseText }`. There is no conversation/session resume — each invocation is stateless.

**Tools** are declared as Gemini `functionDeclarations` (see `TOOL_DECLARATIONS` in `agent/agent.js`) and dispatched in `dispatchToolCall`. Current tools: `search_slack` (uses the invoking user's token via `deps.userToken`) and `fetch_jira_issue`.

**Modes** (`lib/modes.js`) drive how the agent writes: `translate | brief | onboard | simplify`. `modePromptFragment(modeId)` is appended to `SYSTEM_PROMPT` per call. User preference is read from `lib/prefs.js`.

**Listener fan-in**: DM messages (`listeners/events/message.js`) and `@mention`s (`listeners/events/app-mentioned.js`) share `listeners/events/_respond.js`, which builds `deps`, calls `runAgent`, and streams the reply with feedback blocks.

**Feedback blocks** use the `context_actions` block type with `feedback_buttons` elements. A single `feedback` action ID is registered.
