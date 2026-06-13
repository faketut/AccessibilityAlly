import { getPrefs } from '../../lib/prefs.js';
import { buildAppHomeView } from '../views/app-home-builder.js';

/**
 * Publish the App Home view when a user opens the app's Home tab.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'app_home_opened'>} args
 */
export async function handleAppHomeOpened({ client, context, logger }) {
  try {
    const userId = /** @type {string} */ (context.userId);
    const prefs = getPrefs(userId);
    const isMcpConnected = !!context.userToken || !!process.env.SLACK_USER_TOKEN;
    const view = buildAppHomeView({ currentModeId: prefs.mode ?? null, isMcpConnected });
    await client.views.publish({ user_id: userId, view });
  } catch (e) {
    logger.error(`Failed to publish App Home: ${e}`);
  }
}
