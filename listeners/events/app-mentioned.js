import { respondAsAlly } from './_respond.js';

/**
 * Handle app_mention events and run the agent.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'app_mention'>} args
 */
export async function handleAppMentioned({ client, context, event, logger, say, sayStream, setStatus }) {
  try {
    const text = (event.text || '').replace(/<@[A-Z0-9]+>/g, '').trim();
    const threadTs = event.thread_ts || event.ts;

    if (!text) {
      await say({
        text: "Hi \u2014 I'm Ally. Try `/ally help` or right-click a thread \u2192 *Catch me up*.",
        thread_ts: threadTs,
      });
      return;
    }

    await respondAsAlly({ client, context, event, sayStream, setStatus, text });
  } catch (e) {
    logger.error(`Failed to handle app mention: ${e}`);
    await say({
      text: ":warning: Ally hit an error and couldn't reply. Try again in a moment.",
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
