import { getMode, MODES } from '../../lib/modes.js';

/**
 * Build the App Home Block Kit view for AccessibilityAlly.
 * Shows the mode picker plus a brief explanation of what Ally does.
 *
 * @param {Object} [opts]
 * @param {string | null} [opts.currentModeId]
 * @param {boolean} [opts.isSearchEnabled]
 * @returns {import('@slack/types').HomeView}
 */
export function buildAppHomeView({ currentModeId = null, isSearchEnabled = false } = {}) {
  const current = getMode(currentModeId);
  /** @type {import('@slack/types').PlainTextOption[]} */
  const options = MODES.map((m) => ({
    text: { type: 'plain_text', text: m.label },
    value: m.id,
    description: { type: 'plain_text', text: m.description },
  }));
  const initial = options.find((o) => o.value === current.id) ?? options[0];

  /** @type {import('@slack/types').KnownBlock[]} */
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'AccessibilityAlly' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          'I make any Slack thread legible to *anyone* — PMs visiting dev channels, new hires, screen-reader users, and non-native English readers.\n\n' +
          '*How to use me:*\n' +
          "• Right-click any thread → *More actions* → *Catch me up* — I'll summarize for your mode\n" +
          '• `/ally plainify <text>` — rewrite a snippet in plain language\n' +
          '• `/ally mode <translate|brief|onboard|simplify>` — change your default mode\n' +
          '• DM me or `@ally` in a channel for free-form questions',
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*Your mode*\nThis shapes how I write for you.' },
    },
    {
      type: 'actions',
      block_id: 'mode_actions',
      elements: [
        {
          type: 'radio_buttons',
          action_id: 'set_mode',
          initial_option: initial,
          options,
        },
      ],
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: isSearchEnabled
            ? ':white_check_mark: *Slack Real-Time Search is connected.* I can search workspace history for backstory and acronym definitions.'
            : ':warning: *Slack Real-Time Search is not connected.* Set `SLACK_USER_TOKEN` (dev mode) or run OAuth flow to enable cross-channel search.',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: ':lock: All summaries are ephemeral — only you see them. Ally stores only your mode preference and (optionally) a glossary of acronyms it has seen.',
        },
      ],
    },
  ];

  return { type: 'home', blocks };
}
