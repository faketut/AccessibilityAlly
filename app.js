import 'dotenv/config';

import { App, LogLevel } from '@slack/bolt';

import { registerListeners } from './listeners/index.js';

const REQUIRED_ENV = ['SLACK_BOT_TOKEN', 'SLACK_APP_TOKEN', 'GOOGLE_API_KEY'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}. See .env.sample.`);
  process.exit(1);
}
if (!process.env.SLACK_USER_TOKEN) {
  console.warn('SLACK_USER_TOKEN is not set; search_slack tool and App Home search status will be disabled.');
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
  logLevel: LogLevel.WARN,
  ignoreSelf: false,
});

registerListeners(app);

(async () => {
  await app.start();
  app.logger.info('AccessibilityAlly is running.');
})();
