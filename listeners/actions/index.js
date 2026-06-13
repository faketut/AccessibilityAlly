import { handleFeedbackButton } from './feedback-buttons.js';
import { handleSetMode } from './set-mode.js';

/**
 * Register action listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 */
export function register(app) {
  app.action('feedback', handleFeedbackButton);
  app.action('set_mode', handleSetMode);
}
