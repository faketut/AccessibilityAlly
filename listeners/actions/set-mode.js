import { getMode } from '../../lib/modes.js';
import { setPrefs } from '../../lib/prefs.js';
import { buildAppHomeView } from '../views/app-home-builder.js';

/**
 * Handle mode radio-button selection from App Home.
 * Stores the choice and re-renders the home view.
 * @param {import('@slack/bolt').SlackActionMiddlewareArgs<import('@slack/bolt').BlockRadioButtonsAction> & import('@slack/bolt').AllMiddlewareArgs} args
 */
export async function handleSetMode({ ack, client, action, context, logger }) {
  await ack();
  try {
    const userId = /** @type {string} */ (context.userId);
    const selected = /** @type {any} */ (action).selected_option?.value;
    const mode = getMode(selected);
    setPrefs(userId, { mode: mode.id });

    const view = buildAppHomeView({
      currentModeId: mode.id,
      isMcpConnected: !!context.userToken || !!process.env.SLACK_USER_TOKEN,
    });
    await client.views.publish({ user_id: userId, view });

    // Confirm in DM so the user sees feedback even if they navigate away.
    await client.chat.postMessage({
      channel: userId,
      text: `:white_check_mark: Mode set to *${mode.label}*.`,
    });
  } catch (e) {
    logger.error(`set-mode action failed: ${e}`);
  }
}
