import assert from 'node:assert';
import { describe, it } from 'node:test';

import { chunkReplyBlocks } from '../../lib/reply-blocks.js';

describe('chunkReplyBlocks', () => {
  it('returns a placeholder block for empty input', () => {
    const blocks = chunkReplyBlocks('');
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].type, 'section');
    assert.match(blocks[0].text.text, /no response/i);
  });

  it('returns a single section block when there are no headings (e.g. Brief mode)', () => {
    const brief =
      '• auth_v2 rollout blocked on canary error spike. Owner: Ana.\n• Migration on hold until rollback patch lands.';
    const blocks = chunkReplyBlocks(brief);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].type, 'section');
    assert.strictEqual(blocks[0].text.text, brief);
  });

  it('splits on CommonMark **Bold** headings and inserts dividers', () => {
    const text = [
      '**TL;DR**',
      'Rollout blocked.',
      '',
      '**Decisions made**',
      '- Hold migration until patch lands.',
      '',
      '**Glossary**',
      '- auth_v2: the new auth service.',
    ].join('\n');
    const blocks = chunkReplyBlocks(text);
    const types = blocks.map((b) => b.type);
    assert.deepStrictEqual(types, ['section', 'divider', 'section', 'divider', 'section']);
    assert.match(blocks[0].text.text, /^\*TL;DR\*\nRollout blocked\.$/);
    assert.match(blocks[2].text.text, /^\*Decisions made\*\n- Hold migration/);
    assert.match(blocks[4].text.text, /^\*Glossary\*\n- auth_v2/);
  });

  it('splits on Slack *Bold* headings (own-line)', () => {
    const text = ['*TL;DR*', 'Short summary.', '', '*Glossary*', 'KAN-5: ticket.'].join('\n');
    const blocks = chunkReplyBlocks(text);
    assert.deepStrictEqual(
      blocks.map((b) => b.type),
      ['section', 'divider', 'section'],
    );
  });

  it('does NOT treat bullets starting with * as headings', () => {
    const text = '* first bullet\n* second bullet\n* third bullet';
    const blocks = chunkReplyBlocks(text);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(blocks[0].text.text, text);
  });

  it('splits on ## CommonMark headers', () => {
    const text = '## Backstory\nLong story.\n\n## People\n- Ana, staff eng.';
    const blocks = chunkReplyBlocks(text);
    assert.deepStrictEqual(
      blocks.map((b) => b.type),
      ['section', 'divider', 'section'],
    );
    assert.match(blocks[0].text.text, /^\*Backstory\*\n/);
  });

  it('splits on ALL CAPS LABEL: headings', () => {
    const text = 'TL;DR:\nShort.\n\nGLOSSARY:\nKAN-5: ticket.';
    const blocks = chunkReplyBlocks(text);
    assert.deepStrictEqual(
      blocks.map((b) => b.type),
      ['section', 'divider', 'section'],
    );
  });

  it('preserves leading text before the first heading as its own section', () => {
    const text = 'Quick note before headings.\n\n**TL;DR**\nMain summary.';
    const blocks = chunkReplyBlocks(text);
    assert.deepStrictEqual(
      blocks.map((b) => b.type),
      ['section', 'divider', 'section'],
    );
    assert.strictEqual(blocks[0].text.text, 'Quick note before headings.');
    assert.match(blocks[2].text.text, /^\*TL;DR\*\nMain summary\.$/);
  });

  it('strips trailing colons from headings', () => {
    const text = '**TL;DR:**\nbody';
    const blocks = chunkReplyBlocks(text);
    assert.strictEqual(blocks[0].text.text, '*TL;DR*\nbody');
  });

  it('handles a heading with no body (e.g. empty section)', () => {
    const text = '**TL;DR**\n\n**Glossary**\n- KAN-5: ticket.';
    const blocks = chunkReplyBlocks(text);
    assert.deepStrictEqual(
      blocks.map((b) => b.type),
      ['section', 'divider', 'section'],
    );
    assert.strictEqual(blocks[0].text.text, '*TL;DR*');
  });
});
