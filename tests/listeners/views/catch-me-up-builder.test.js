import assert from 'node:assert';
import { describe, it } from 'node:test';
import { MODES } from '../../../lib/modes.js';
import { buildCatchMeUpModal } from '../../../listeners/views/catch-me-up-builder.js';

const BASE = { channelId: 'C123', threadTs: '1111.0000', messageTs: '1111.0001', defaultModeId: 'translate' };

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

  it('contains a mode radio_buttons block with all mode options', () => {
    const modal = buildCatchMeUpModal(BASE);
    const modeBlock = modal.blocks.find((b) => b.type === 'input' && /** @type {any} */ (b).block_id === 'mode_block');
    assert.ok(modeBlock, 'mode_block not found');
    const el = /** @type {any} */ (modeBlock).element;
    assert.strictEqual(el.type, 'radio_buttons');
    assert.strictEqual(el.action_id, 'mode');
    assert.strictEqual(el.options.length, MODES.length);
  });

  it('sets initial_option to the supplied defaultModeId', () => {
    for (const m of MODES) {
      const modal = buildCatchMeUpModal({ ...BASE, defaultModeId: m.id });
      const modeBlock = modal.blocks.find((b) => /** @type {any} */ (b).block_id === 'mode_block');
      const el = /** @type {any} */ (modeBlock).element;
      assert.strictEqual(el.initial_option.value, m.id, `initial_option wrong for mode ${m.id}`);
    }
  });

  it('falls back to first option for unknown defaultModeId', () => {
    const modal = buildCatchMeUpModal({ ...BASE, defaultModeId: 'unknown_xyz' });
    const modeBlock = modal.blocks.find((b) => /** @type {any} */ (b).block_id === 'mode_block');
    const el = /** @type {any} */ (modeBlock).element;
    assert.strictEqual(el.initial_option.value, MODES[0].id);
  });

  it('contains an optional focus text-input block', () => {
    const modal = buildCatchMeUpModal(BASE);
    const focusBlock = modal.blocks.find((b) => /** @type {any} */ (b).block_id === 'focus_block');
    assert.ok(focusBlock, 'focus_block not found');
    assert.strictEqual(/** @type {any} */ (focusBlock).optional, true);
  });
});
