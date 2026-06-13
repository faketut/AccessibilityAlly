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
 *   context: { userId?: string, userToken?: string },
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
    userToken: context.userToken,
    modeId: getPrefs(userId).mode,
  };
  const { responseText } = await runAgent(text, deps);
  const streamer = sayStream();
  await streamer.append({ markdown_text: responseText });
  // Finalize with structured blocks: chunked sections (better visual hierarchy
  // and screen-reader semantics than one giant mrkdwn block) + feedback buttons.
  await streamer.stop({ blocks: [...chunkReplyBlocks(responseText), ...buildFeedbackBlocks()] });
}
