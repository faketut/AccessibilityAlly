import { getPersona } from '../../lib/personas.js';
import { setPrefs } from '../../lib/prefs.js';
import { buildAppHomeView } from '../views/app-home-builder.js';

/**
 * Handle persona radio-button selection from App Home.
 * Stores the choice and re-renders the home view.
 * @param {import('@slack/bolt').SlackActionMiddlewareArgs<import('@slack/bolt').BlockRadioButtonsAction> & import('@slack/bolt').AllMiddlewareArgs} args
 */
export async function handleSetPersona({ ack, body: _body, client, action, context, logger }) {
  await ack();
  try {
    const userId = /** @type {string} */ (context.userId);
    const selected = /** @type {any} */ (action).selected_option?.value;
    const persona = getPersona(selected);
    setPrefs(userId, { persona: persona.id });

    const view = buildAppHomeView({
      currentPersonaId: persona.id,
      isMcpConnected: !!context.userToken || !!process.env.SLACK_USER_TOKEN,
    });
    await client.views.publish({ user_id: userId, view });

    // Confirm in DM so the user sees feedback even if they navigate away.
    await client.chat.postMessage({
      channel: userId,
      text: `:white_check_mark: Audience persona set to *${persona.label}*.`,
    });
  } catch (e) {
    logger.error(`set-persona action failed: ${e}`);
  }
}
