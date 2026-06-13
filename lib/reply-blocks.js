/**
 * Split the agent's raw markdown reply into one section block per top-level
 * heading, with dividers between sections. Falls back to a single section
 * block when no headings are detected (e.g. Brief mode's 2 bullets, or
 * plainify output that's just a rewritten paragraph).
 *
 * Recognised heading patterns (each must occupy an entire line):
 *   - CommonMark headers:    "## TL;DR"
 *   - CommonMark bold:       "**TL;DR**" or "**TL;DR:**"
 *   - Slack mrkdwn bold:     "*TL;DR*"  or "*TL;DR:*"
 *   - ALL CAPS label:        "TL;DR:"   or "GLOSSARY:"
 *
 * The trailing colon is optional in every case.
 *
 * @param {string} text - The agent's markdown reply.
 * @returns {Array<{type: string, text?: {type: 'mrkdwn', text: string}}>}
 *   Block-Kit-shaped blocks: section blocks with dividers between them.
 *   The bold heading is preserved as the first line of each section so
 *   screen readers still announce it as part of the section content.
 */
export function chunkReplyBlocks(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return [{ type: 'section', text: { type: 'mrkdwn', text: '(no response)' } }];
  }

  const lines = trimmed.split('\n');
  /** @type {Array<{heading: string, body: string[]}>} */
  const chunks = [];
  /** @type {string[]} */
  const preamble = [];

  for (const line of lines) {
    const heading = matchHeading(line);
    if (heading) {
      chunks.push({ heading, body: [] });
    } else if (chunks.length === 0) {
      preamble.push(line);
    } else {
      chunks[chunks.length - 1].body.push(line);
    }
  }

  // No headings at all → single section block.
  if (chunks.length === 0) {
    return [{ type: 'section', text: { type: 'mrkdwn', text: trimmed } }];
  }

  /** @type {Array<{type: string, text?: {type: 'mrkdwn', text: string}}>} */
  const blocks = [];

  const preambleText = preamble.join('\n').trim();
  if (preambleText) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: preambleText } });
  }

  for (const chunk of chunks) {
    if (blocks.length > 0) {
      blocks.push({ type: 'divider' });
    }
    const body = chunk.body.join('\n').trim();
    const sectionText = body ? `*${chunk.heading}*\n${body}` : `*${chunk.heading}*`;
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: sectionText } });
  }

  return blocks;
}

/**
 * @param {string} rawLine
 * @returns {string | null} the heading text without markup/colons, or null
 */
function matchHeading(rawLine) {
  const line = rawLine.trim();
  if (!line) return null;

  // ## Heading  (CommonMark)
  let m = line.match(/^#{1,6}\s+(.+?)\s*:?\s*$/);
  if (m) return stripTrailingColon(m[1]);

  // **Heading** or **Heading:** (CommonMark bold on its own line)
  m = line.match(/^\*\*([^*]+?)\*\*\s*:?\s*$/);
  if (m) return stripTrailingColon(m[1]);

  // *Heading* or *Heading:* (Slack mrkdwn bold on its own line).
  // Guard: must not be a bullet item (* xxx) or italic (*xxx _yyy_*).
  m = line.match(/^\*([^*\s][^*]*?)\*\s*:?\s*$/);
  if (m) return stripTrailingColon(m[1]);

  // ALL CAPS LABEL: (at least 3 letters, no lowercase)
  m = line.match(/^([A-Z][A-Z0-9 /;'-]{2,}):\s*$/);
  if (m) return m[1].trim();

  return null;
}

/**
 * @param {string} s
 */
function stripTrailingColon(s) {
  return s.trim().replace(/:\s*$/, '').trim();
}
