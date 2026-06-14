import { respondAsAlly } from './_respond.js';

/**
 * @param {import('@slack/types').MessageEvent} event
 * @returns {event is import('@slack/types').GenericMessageEvent}
 */
function isGenericMessageEvent(event) {
  return !('subtype' in event && event.subtype !== undefined);
}

/**
 * Handle DM messages sent to Ally.
 *
 * Thread replies in channels are handled via @mention or the catch-me-up shortcut;
 * we don't auto-join threads here.
 *
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'message'>} args
 */
export async function handleMessage({ client, context, event, logger, say, sayStream, setStatus }) {
  if (!isGenericMessageEvent(event)) return;
  if (event.bot_id) return;
  if (event.channel_type !== 'im') return;

  try {
    await respondAsAlly({ client, context, event, logger, sayStream, setStatus, text: event.text || '' });
  } catch (e) {
    logger.error(`Failed to handle message: ${e}`);
    await say({
      text: ":warning: Ally hit an error and couldn't reply. Try again in a moment.",
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
