import { runAgent } from '../../agent/index.js';
import { getPrefs } from '../../lib/prefs.js';
import { sessionStore } from '../../thread-context/index.js';
import { buildFeedbackBlocks } from '../views/feedback-builder.js';

/**
 * @param {import('@slack/types').MessageEvent} event
 * @returns {event is import('@slack/types').GenericMessageEvent}
 */
function isGenericMessageEvent(event) {
  return !('subtype' in event && event.subtype !== undefined);
}

/**
 * Handle messages sent to Ally via DM or in threads it is already part of.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'message'>} args
 */
export async function handleMessage({ client, context, event, logger, say, sayStream, setStatus }) {
  if (!isGenericMessageEvent(event)) return;
  if (event.bot_id) return;

  const isDm = event.channel_type === 'im';
  const isThreadReply = !!event.thread_ts;

  if (isDm) {
    // DMs are always handled
  } else if (isThreadReply) {
    const session = sessionStore.getSession(event.channel, /** @type {string} */ (event.thread_ts));
    if (session === null) return;
  } else {
    return;
  }

  try {
    const channelId = event.channel;
    const text = event.text || '';
    const threadTs = event.thread_ts || event.ts;
    const userId = /** @type {string} */ (context.userId);

    const existingSessionId = sessionStore.getSession(channelId, threadTs);

    await setStatus({
      status: 'Translating\u2026',
      loading_messages: [
        'Reading the thread carefully\u2026',
        'Looking up acronyms\u2026',
        'Finding owners and decisions\u2026',
        'Writing for your audience\u2026',
      ],
    });

    const modeId = getPrefs(userId).mode;
    const deps = {
      client,
      userId,
      channelId,
      threadTs,
      messageTs: event.ts,
      userToken: context.userToken,
      modeId,
    };
    const { responseText, sessionId: newSessionId } = await runAgent(text, existingSessionId ?? undefined, deps);

    const streamer = sayStream();
    await streamer.append({ markdown_text: responseText });
    const feedbackBlocks = buildFeedbackBlocks();
    await streamer.stop({ blocks: feedbackBlocks });

    if (newSessionId) {
      sessionStore.setSession(channelId, threadTs, newSessionId);
    }
  } catch (e) {
    logger.error(`Failed to handle message: ${e}`);
    await say({
      text: ":warning: Ally hit an error and couldn't reply. Try again in a moment.",
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
