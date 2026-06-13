import assert from 'node:assert';
import { describe, it } from 'node:test';
import { PERSONAS } from '../../../lib/personas.js';
import { buildCatchMeUpModal } from '../../../listeners/views/catch-me-up-builder.js';

const BASE = { channelId: 'C123', threadTs: '1111.0000', messageTs: '1111.0001', defaultPersonaId: 'translate' };

describe('buildCatchMeUpModal', () => {
  it('returns a modal view with correct callback_id', () => {
    const modal = buildCatchMeUpModal(BASE);
    assert.strictEqual(modal.type, 'modal');
    assert.strictEqual(modal.callback_id, 'catch_me_up_submit');
  });

  it('encodes channelId, threadTs and messageTs in private_metadata JSON', () => {
    const modal = buildCatchMeUpModal(BASE);
    const meta = JSON.parse(modal.private_metadata ?? '{}');
    assert.strictEqual(meta.channelId, BASE.channelId);
    assert.strictEqual(meta.threadTs, BASE.threadTs);
    assert.strictEqual(meta.messageTs, BASE.messageTs);
  });

  it('contains a persona radio_buttons block with all persona options', () => {
    const modal = buildCatchMeUpModal(BASE);
    const personaBlock = modal.blocks.find(
      (b) => b.type === 'input' && /** @type {any} */ (b).block_id === 'persona_block',
    );
    assert.ok(personaBlock, 'persona_block not found');
    const el = /** @type {any} */ (personaBlock).element;
    assert.strictEqual(el.type, 'radio_buttons');
    assert.strictEqual(el.action_id, 'persona');
    assert.strictEqual(el.options.length, PERSONAS.length);
  });

  it('sets initial_option to the supplied defaultPersonaId', () => {
    for (const p of PERSONAS) {
      const modal = buildCatchMeUpModal({ ...BASE, defaultPersonaId: p.id });
      const personaBlock = modal.blocks.find((b) => /** @type {any} */ (b).block_id === 'persona_block');
      const el = /** @type {any} */ (personaBlock).element;
      assert.strictEqual(el.initial_option.value, p.id, `initial_option wrong for persona ${p.id}`);
    }
  });

  it('falls back to first option for unknown defaultPersonaId', () => {
    const modal = buildCatchMeUpModal({ ...BASE, defaultPersonaId: 'unknown_xyz' });
    const personaBlock = modal.blocks.find((b) => /** @type {any} */ (b).block_id === 'persona_block');
    const el = /** @type {any} */ (personaBlock).element;
    assert.strictEqual(el.initial_option.value, PERSONAS[0].id);
  });

  it('contains an optional focus text-input block', () => {
    const modal = buildCatchMeUpModal(BASE);
    const focusBlock = modal.blocks.find((b) => /** @type {any} */ (b).block_id === 'focus_block');
    assert.ok(focusBlock, 'focus_block not found');
    assert.strictEqual(/** @type {any} */ (focusBlock).optional, true);
  });
});
