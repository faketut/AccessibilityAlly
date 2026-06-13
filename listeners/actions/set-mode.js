import { getMode } from '../../lib/modes.js';
import { setPrefs } from '../../lib/prefs.js';
import { buildAppHomeView } from '../views/app-home-builder.js';

/**
 * Handle the "Use this mode" button click from App Home.
 *
 * The button's `value` carries the mode id (e.g. "translate"). We save it
 * as the user's preference, re-render the home view so the active card
 * shows the primary "Active" state, and DM a confirmation so the user
 * gets feedback even if they navigate away from App Home.
 *
 * @param {import('@slack/bolt').SlackActionMiddlewareArgs<import('@slack/bolt').BlockButtonAction> & import('@slack/bolt').AllMiddlewareArgs} args
 */
export async function handleSetMode({ ack, client, action, context, logger }) {
  await ack();
  try {
    const userId = /** @type {string} */ (context.userId);
    const selected = /** @type {any} */ (action).value;
    const mode = getMode(selected);
    setPrefs(userId, { mode: mode.id });

    const view = buildAppHomeView({
      currentModeId: mode.id,
      isSearchEnabled: !!context.userToken || !!process.env.SLACK_USER_TOKEN,
    });
    await client.views.publish({ user_id: userId, view });

    await client.chat.postMessage({
      channel: userId,
      text: `:white_check_mark: Mode set to *${mode.label}*.`,
    });
  } catch (e) {
    logger.error(`set-mode action failed: ${e}`);
  }
}
