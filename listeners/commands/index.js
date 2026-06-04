import { handleAllyCommand } from './ally.js';

/**
 * Register slash-command listeners with the Bolt app.
 * @param {import('@slack/bolt').App} app
 */
export function register(app) {
  app.command('/ally', handleAllyCommand);
}
