import { handleCatchMeUpShortcut } from './catch-me-up.js';

/**
 * Register shortcut listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 */
export function register(app) {
  app.shortcut('catch_me_up', handleCatchMeUpShortcut);
}
