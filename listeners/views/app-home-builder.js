import { getMode, MODES } from '../../lib/modes.js';

/**
 * Build the App Home Block Kit view for AccessibilityAlly.
 *
 * Layout (top to bottom):
 *   - Title header + one-line value prop
 *   - "How to use me" section
 *   - "Your mode" sub-header
 *   - Four mode cards: one section block per mode, each with its own
 *     "Use this mode" / "✓ Active" button. The active mode is shown
 *     as a confirm-style primary button so the choice is unmistakable.
 *   - Two context blocks: search status + privacy note
 *
 * @param {Object} [opts]
 * @param {string | null} [opts.currentModeId]
 * @param {boolean} [opts.isSearchEnabled]
 * @returns {import('@slack/types').HomeView}
 */
export function buildAppHomeView({ currentModeId = null, isSearchEnabled = false } = {}) {
  const current = getMode(currentModeId);

  /** @type {import('@slack/types').KnownBlock[]} */
  const modeCards = [];
  for (const m of MODES) {
    const isActive = m.id === current.id;
    modeCards.push({
      type: 'section',
      block_id: `mode_card_${m.id}`,
      text: {
        type: 'mrkdwn',
        text: `${isActive ? ':white_check_mark: ' : ''}*${m.label}*\n${m.description}`,
      },
      accessory: {
        type: 'button',
        action_id: 'set_mode',
        value: m.id,
        text: { type: 'plain_text', text: isActive ? 'Active' : 'Use this mode' },
        ...(isActive ? { style: 'primary' } : {}),
      },
    });
  }

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
        text: 'I make any Slack thread legible to *anyone* — PMs visiting dev channels, new hires, screen-reader users, and non-native English readers.',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '*How to use me:*\n' +
          "• Right-click any thread → *More actions* → *Catch me up* — I'll summarize for your mode\n" +
          '• `/ally plainify <text>` — rewrite a snippet in plain language\n' +
          '• `/ally mode <translate|brief|onboard|simplify>` — change your default mode\n' +
          '• DM me or `@ally` in a channel for free-form questions',
      },
    },
    { type: 'divider' },
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Your mode' },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Currently active: *${current.label}*. This shapes every summary, plainify, and reply.`,
        },
      ],
    },
    ...modeCards,
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
