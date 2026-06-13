import { MODES } from '../../lib/modes.js';

/** @type {import('@slack/types').PlainTextOption[]} */
const MODE_OPTIONS = MODES.map((m) => ({
  text: { type: 'plain_text', text: m.label },
  value: m.id,
  description: { type: 'plain_text', text: m.description },
}));

/**
 * Build the "Catch me up" modal that lets the user pick a mode before Ally
 * summarizes the source thread.
 * @param {Object} params
 * @param {string} params.channelId
 * @param {string} params.threadTs
 * @param {string} params.messageTs
 * @param {string} params.defaultModeId
 * @returns {import('@slack/types').ModalView}
 */
export function buildCatchMeUpModal({ channelId, threadTs, messageTs, defaultModeId }) {
  const initial = MODE_OPTIONS.find((o) => o.value === defaultModeId) ?? MODE_OPTIONS[0];
  return {
    type: 'modal',
    callback_id: 'catch_me_up_submit',
    private_metadata: JSON.stringify({ channelId, threadTs, messageTs }),
    title: { type: 'plain_text', text: 'Catch me up' },
    submit: { type: 'plain_text', text: 'Summarize' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "I'll read this thread and translate it for the mode you pick. Output is ephemeral — only you will see it.",
        },
      },
      {
        type: 'input',
        block_id: 'mode_block',
        label: { type: 'plain_text', text: 'Mode' },
        element: {
          type: 'radio_buttons',
          action_id: 'mode',
          initial_option: initial,
          options: MODE_OPTIONS,
        },
      },
      {
        type: 'input',
        block_id: 'focus_block',
        optional: true,
        label: { type: 'plain_text', text: 'Anything specific you want to know? (optional)' },
        element: {
          type: 'plain_text_input',
          action_id: 'focus',
          multiline: true,
          placeholder: { type: 'plain_text', text: 'e.g. "is this still blocking the launch?"' },
        },
      },
    ],
  };
}
