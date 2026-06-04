/**
 * AccessibilityAlly personas — the lens through which the agent summarizes/explains.
 *
 * Four personas cover the matrix: cross-functional visitor (PM), exec (time-poor decider),
 * new-hire (no tribal knowledge), plain-language (covers a11y, ESL, neurodivergent,
 * non-technical readers in one variant).
 */

/** @typedef {'pm' | 'exec' | 'new_hire' | 'plain'} PersonaId */

/**
 * @typedef {Object} Persona
 * @property {PersonaId} id
 * @property {string} label - Short label shown in pickers.
 * @property {string} description - One-line description for help text.
 * @property {string} prompt - Persona-specific guidance appended to the agent system prompt.
 */

/** @type {Persona[]} */
export const PERSONAS = [
  {
    id: 'pm',
    label: 'Cross-functional visitor (PM)',
    description: 'A PM dropped into a channel outside their reference frame.',
    prompt: [
      'AUDIENCE: a product manager visiting a channel outside their domain.',
      'They understand product, users, dates, and trade-offs — not the jargon, code, or tribal history of this team.',
      'Lead with the bottom line: what is happening, who owns it, when does it ship, what is at risk.',
      'Translate every acronym and code reference into plain English the first time it appears.',
      'Surface decisions and blockers, not implementation details.',
    ].join('\n'),
  },
  {
    id: 'exec',
    label: 'Executive (2-bullet brief)',
    description: 'A leader who needs the headline + dollars/dates in under 30 seconds.',
    prompt: [
      'AUDIENCE: a senior executive with 30 seconds.',
      'Output at most TWO bullets. Each bullet must contain: what changed, the dollar/customer/date impact, who owns it.',
      'No jargon. No process detail. No history unless it changes the decision.',
      'If a decision is needed, say so explicitly in a single line at the end.',
    ].join('\n'),
  },
  {
    id: 'new_hire',
    label: 'New hire (week 1)',
    description: 'Someone who knows nothing about people, projects, or vocabulary yet.',
    prompt: [
      'AUDIENCE: a new hire in their first week. Assume zero prior context.',
      'Explain the backstory first: what this project is, why it exists, where it stands.',
      'Introduce people by role the first time they appear ("Ana, the staff engineer who owns auth").',
      'Define every acronym and internal codename inline.',
      'End with "people to talk to" and "docs to read next".',
    ].join('\n'),
  },
  {
    id: 'plain',
    label: 'Plain language (a11y / ESL / non-technical)',
    description: 'Screen-reader friendly, short sentences, no idioms, no jargon.',
    prompt: [
      'AUDIENCE: a reader who needs maximum clarity. This includes screen-reader users, non-native English speakers, neurodivergent readers, and non-technical staff.',
      'Use short sentences. One idea per sentence. Active voice.',
      'No idioms, sarcasm, US-centric references, or figures of speech.',
      'No emoji-only signals — if you use an emoji, also state its meaning in words.',
      'Use semantic structure (headings, lists) so screen readers can navigate it.',
      'Define every acronym on first use, even common ones.',
    ].join('\n'),
  },
];

export const DEFAULT_PERSONA_ID = /** @type {PersonaId} */ ('pm');

/**
 * @param {string | undefined | null} id
 * @returns {Persona}
 */
export function getPersona(id) {
  return (
    PERSONAS.find((p) => p.id === id) ?? /** @type {Persona} */ (PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID))
  );
}

/**
 * Build the persona-specific suffix appended to the agent system prompt.
 * @param {string | undefined | null} id
 * @returns {string}
 */
export function personaPromptFragment(id) {
  const persona = getPersona(id);
  return [
    '',
    '## ACTIVE PERSONA',
    persona.prompt,
    '',
    'Always finish with a short "Glossary" section listing every acronym, codename, or internal reference you used, with a one-line definition. Skip the section only if there were none.',
  ].join('\n');
}
