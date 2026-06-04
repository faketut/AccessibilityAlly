import { handleCatchMeUpSubmit } from './catch-me-up-submit.js';

/**
 * Register view (modal) submission listeners.
 * @param {import('@slack/bolt').App} app
 */
export function register(app) {
  app.view('catch_me_up_submit', handleCatchMeUpSubmit);
}
