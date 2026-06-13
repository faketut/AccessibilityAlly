import { getPersona, PERSONAS } from '../../lib/personas.js';

/**
 * Build the App Home Block Kit view for AccessibilityAlly.
 * Shows the persona picker plus a brief explanation of what Ally does.
 *
 * @param {Object} [opts]
 * @param {string | null} [opts.currentPersonaId]
 * @param {boolean} [opts.isMcpConnected]
 * @returns {import('@slack/types').HomeView}
 */
export function buildAppHomeView({ currentPersonaId = null, isMcpConnected = false } = {}) {
  const current = getPersona(currentPersonaId);
  /** @type {import('@slack/types').PlainTextOption[]} */
  const options = PERSONAS.map((p) => ({
    text: { type: 'plain_text', text: p.label },
    value: p.id,
    description: { type: 'plain_text', text: p.description },
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
          "• Right-click any thread → *More actions* → *Catch me up* — I'll summarize for your persona\n" +
          '• `/ally plainify <text>` — rewrite a snippet in plain language\n' +
          '• `/ally persona <translate|brief|onboard|simplify>` — change your default audience\n' +
          '• DM me or `@ally` in a channel for free-form questions',
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: '*Your audience persona*\nThis shapes how I write for you.' },
    },
    {
      type: 'actions',
      block_id: 'persona_actions',
      elements: [
        {
          type: 'radio_buttons',
          action_id: 'set_persona',
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
          text: isMcpConnected
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
          text: ':lock: All summaries are ephemeral — only you see them. Ally stores only your persona preference and (optionally) a glossary of acronyms it has seen.',
        },
      ],
    },
  ];

  return { type: 'home', blocks };
}
