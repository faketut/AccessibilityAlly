/**
 * AccessibilityAlly personas — the lens through which the agent summarizes/explains.
 *
 * Four verb-named personas cover the matrix: translate (cross-functional PM),
 * brief (time-poor exec), onboard (no-tribal-knowledge new hire), simplify (a11y,
 * ESL, neurodivergent, non-technical readers in one variant).
 */

/** @typedef {'translate' | 'brief' | 'onboard' | 'simplify'} PersonaId */

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
    id: 'translate',
    label: 'Translate — cross-functional PM',
    description: 'Translate jargon for a PM visiting from another team.',
    prompt: [
      'MODE: TRANSLATE.',
      'AUDIENCE: a product manager visiting a channel outside their domain. They understand product, users, dates, and trade-offs — not the jargon, code, or tribal history of this team.',
      'GOAL: translate every acronym, codename, and code reference into plain English the first time it appears, then surface the product-relevant signal.',
      'STRUCTURE: lead with the bottom line — what is happening, who owns it, when does it ship, what is at risk. Then decisions and blockers.',
      'OMIT: implementation details and internal debates that do not change the decision.',
    ].join('\n'),
  },
  {
    id: 'brief',
    label: 'Brief — executive (2 bullets)',
    description: 'Two-bullet brief: what changed, the impact, who owns it.',
    prompt: [
      'MODE: BRIEF.',
      'AUDIENCE: a senior executive with 30 seconds. Skim-only.',
      'GOAL: compress everything into a two-bullet executive brief.',
      'STRUCTURE: at most TWO bullets. Each bullet contains, in order: what changed, the dollar/customer/date impact, who owns it. If a decision is needed, add one final line starting with "DECISION NEEDED:".',
      'OMIT: jargon, process detail, history (unless it changes the decision), and any catch-me-up sections beyond the brief itself.',
    ].join('\n'),
  },
  {
    id: 'onboard',
    label: 'Onboard — new hire (week 1)',
    description: 'Explain backstory, people, and acronyms for a first-week hire.',
    prompt: [
      'MODE: ONBOARD.',
      'AUDIENCE: a new hire in their first week. Assume zero prior context — no people, no project history, no vocabulary.',
      'GOAL: orient them from scratch so they can join the conversation safely.',
      'STRUCTURE: start with backstory (what this project is, why it exists, where it stands). Introduce people by role the first time they appear ("Ana, the staff engineer who owns auth"). Define every acronym and internal codename inline. End with "People to talk to" and "Docs to read next".',
      'OMIT: nothing important — prefer over-explaining to under-explaining.',
    ].join('\n'),
  },
  {
    id: 'simplify',
    label: 'Simplify — a11y / ESL / non-technical',
    description: 'Short sentences, no jargon, screen-reader friendly.',
    prompt: [
      'MODE: SIMPLIFY.',
      'AUDIENCE: a reader who needs maximum clarity — screen-reader users, non-native English speakers, neurodivergent readers, and non-technical staff.',
      'GOAL: rewrite the content for maximum accessibility without losing meaning.',
      'STRUCTURE: short sentences, one idea per sentence, active voice. Use semantic headings and lists so screen readers can navigate. Define every acronym on first use, even common ones.',
      'OMIT: idioms, sarcasm, US-centric references, figures of speech, and emoji-only signals (if you use an emoji, also state its meaning in words).',
    ].join('\n'),
  },
];

export const DEFAULT_PERSONA_ID = /** @type {PersonaId} */ ('translate');

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
    `The user has selected the *${persona.label}* persona. The MODE below is your operating mode for this response — it overrides any conflicting guidance about length, tone, or structure in the system prompt.`,
    '',
    persona.prompt,
    '',
    'Always finish with a short "Glossary" section listing every acronym, codename, or internal reference you used, with a one-line definition. Skip the section only if there were none, or if the MODE explicitly forbids extra sections.',
  ].join('\n');
}
