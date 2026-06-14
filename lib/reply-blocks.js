/**
 * Split the agent's raw markdown reply into one Slack `markdown` block per
 * top-level heading, with dividers between sections. Falls back to a single
 * `markdown` block when no headings are detected (e.g. Brief mode's 2 bullets,
 * or plainify output that's just a rewritten paragraph).
 *
 * We use Slack's `markdown` block (added for AI apps) rather than `section` +
 * `mrkdwn`, because Gemini emits CommonMark — `**bold**`, `*italic*`,
 * `- bullets`, fenced code — which `mrkdwn` blocks render literally. The
 * `markdown` block translates CommonMark natively so the output looks the way
 * the model meant it.
 *
 * Recognised heading patterns (each must occupy an entire line):
 *   - CommonMark headers:    "## TL;DR"
 *   - CommonMark bold:       "**TL;DR**" or "**TL;DR:**"
 *   - Slack mrkdwn bold:     "*TL;DR*"  or "*TL;DR:*"
 *   - ALL CAPS label:        "TL;DR:"   or "GLOSSARY:"
 *
 * The trailing colon is optional in every case. Detected headings are
 * normalized to `## Heading` so Slack renders them as semantic headers (also
 * better for screen readers than bold-as-pseudo-header).
 *
 * @param {string} text - The agent's markdown reply.
 * @returns {Array<{type: string, text?: string}>}
 *   Block-Kit-shaped blocks: `markdown` blocks with `divider` blocks between
 *   them. The block's `text` field is a CommonMark string.
 */
export function chunkReplyBlocks(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return [{ type: 'markdown', text: '(no response)' }];
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

  // No headings at all → single markdown block.
  if (chunks.length === 0) {
    return [{ type: 'markdown', text: trimmed }];
  }

  /** @type {Array<{type: string, text?: string}>} */
  const blocks = [];

  const preambleText = preamble.join('\n').trim();
  if (preambleText) {
    blocks.push({ type: 'markdown', text: preambleText });
  }

  for (const chunk of chunks) {
    if (blocks.length > 0) {
      blocks.push({ type: 'divider' });
    }
    const body = chunk.body.join('\n').trim();
    const sectionText = body ? `## ${chunk.heading}\n${body}` : `## ${chunk.heading}`;
    blocks.push({ type: 'markdown', text: sectionText });
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
