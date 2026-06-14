import { runAgent } from '../../agent/index.js';
import { getPrefs } from '../../lib/prefs.js';
import { chunkReplyBlocks } from '../../lib/reply-blocks.js';
import { buildFeedbackBlocks } from '../views/feedback-builder.js';

const STATUS = {
  status: 'Translating\u2026',
  loading_messages: [
    'Reading the thread carefully\u2026',
    'Looking up acronyms\u2026',
    'Finding owners and decisions\u2026',
    'Writing for your audience\u2026',
  ],
};

/**
 * Common path for DM messages and @mentions: run the agent in the user's mode
 * and stream the reply with a feedback prompt.
 *
 * @param {{
 *   client: import('@slack/web-api').WebClient,
 *   context: { userId?: string },
 *   event: { channel: string, ts: string, thread_ts?: string },
 *   sayStream: any,
 *   setStatus: any,
 *   text: string,
 * }} args
 */
export async function respondAsAlly({ client, context, event, sayStream, setStatus, text }) {
  await setStatus(STATUS);
  const userId = /** @type {string} */ (context.userId);
  const threadTs = event.thread_ts || event.ts;
  const deps = {
    client,
    userId,
    channelId: event.channel,
    threadTs,
    messageTs: event.ts,
    modeId: getPrefs(userId).mode,
  };
  const { responseText } = await runAgent(text, deps);
  // runAgent returns the full reply in one shot — no incremental tokens — so we
  // skip `append` and finalize the stream in a single `stop` call. Calling both
  // append + stop caused a duplicate render because stopStream sends the final
  // `blocks` *in addition to* any already-buffered/flushed markdown_text chunks.
  const streamer = sayStream();
  await streamer.stop({ blocks: [...chunkReplyBlocks(responseText), ...buildFeedbackBlocks()] });
}
