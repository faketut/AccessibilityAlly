import { PERSONAS } from '../../lib/personas.js';

/** @type {import('@slack/types').PlainTextOption[]} */
const PERSONA_OPTIONS = PERSONAS.map((p) => ({
  text: { type: 'plain_text', text: p.label },
  value: p.id,
  description: { type: 'plain_text', text: p.description },
}));

/**
 * Build the "Catch me up" modal that lets the user pick a persona before Ally
 * summarizes the source thread.
 * @param {Object} params
 * @param {string} params.channelId
 * @param {string} params.threadTs
 * @param {string} params.messageTs
 * @param {string} params.defaultPersonaId
 * @returns {import('@slack/types').ModalView}
 */
export function buildCatchMeUpModal({ channelId, threadTs, messageTs, defaultPersonaId }) {
  const initial = PERSONA_OPTIONS.find((o) => o.value === defaultPersonaId) ?? PERSONA_OPTIONS[0];
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
          text: "I'll read this thread and translate it for the audience you pick. Output is ephemeral — only you will see it.",
        },
      },
      {
        type: 'input',
        block_id: 'persona_block',
        label: { type: 'plain_text', text: 'Audience' },
        element: {
          type: 'radio_buttons',
          action_id: 'persona',
          initial_option: initial,
          options: PERSONA_OPTIONS,
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
