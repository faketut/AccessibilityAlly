import { getPrefs } from '../../lib/prefs.js';
import { buildCatchMeUpModal } from '../views/catch-me-up-builder.js';

/**
 * Open the mode-picker modal when a user invokes the "Catch me up"
 * message shortcut on a thread.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackShortcutMiddlewareArgs<import('@slack/bolt').MessageShortcut>} args
 */
export async function handleCatchMeUpShortcut({ ack, client, shortcut, logger, context }) {
  await ack();
  try {
    const userId = /** @type {string} */ (context.userId);
    const prefs = getPrefs(userId);
    const channelId = shortcut.channel.id;
    const sourceTs = shortcut.message_ts;
    const threadTs = /** @type {any} */ (shortcut.message)?.thread_ts || sourceTs;

    const view = buildCatchMeUpModal({
      channelId,
      threadTs,
      messageTs: sourceTs,
      defaultModeId: prefs.mode ?? 'translate',
    });

    await client.views.open({ trigger_id: shortcut.trigger_id, view });
  } catch (e) {
    logger.error(`Failed to open Catch-me-up modal: ${e}`);
  }
}
