import assert from 'node:assert';
import { describe, it } from 'node:test';

import { MODES } from '../../../lib/modes.js';
import { buildAppHomeView } from '../../../listeners/views/app-home-builder.js';

describe('buildAppHomeView', () => {
  it('returns a home view with the AccessibilityAlly header', () => {
    const view = buildAppHomeView();
    assert.strictEqual(view.type, 'home');
    assert.ok(Array.isArray(view.blocks));
    const header = view.blocks.find((b) => b.type === 'header');
    assert.ok(header && /** @type {any} */ (header).text.text.includes('AccessibilityAlly'));
  });

  it('renders one mode card per mode, each with a set_mode button carrying the mode id', () => {
    const view = buildAppHomeView();
    for (const m of MODES) {
      const card = view.blocks.find(
        (b) => b.type === 'section' && /** @type {any} */ (b).block_id === `mode_card_${m.id}`,
      );
      assert.ok(card, `expected mode_card_${m.id} block`);
      const button = /** @type {any} */ (card).accessory;
      assert.strictEqual(button.type, 'button');
      assert.strictEqual(button.action_id, 'set_mode');
      assert.strictEqual(button.value, m.id);
    }
  });

  it('marks the supplied current mode card as Active (primary button)', () => {
    const view = buildAppHomeView({ currentModeId: 'simplify' });
    const simplify = view.blocks.find(
      (b) => b.type === 'section' && /** @type {any} */ (b).block_id === 'mode_card_simplify',
    );
    const translate = view.blocks.find(
      (b) => b.type === 'section' && /** @type {any} */ (b).block_id === 'mode_card_translate',
    );
    assert.strictEqual(/** @type {any} */ (simplify).accessory.text.text, 'Active');
    assert.strictEqual(/** @type {any} */ (simplify).accessory.style, 'primary');
    assert.strictEqual(/** @type {any} */ (translate).accessory.text.text, 'Use this mode');
    assert.strictEqual(/** @type {any} */ (translate).accessory.style, undefined);
  });

  it('shows the active mode label in the header context line', () => {
    const view = buildAppHomeView({ currentModeId: 'brief' });
    const contexts = view.blocks.filter((b) => b.type === 'context');
    const text = contexts.flatMap((b) => /** @type {any} */ (b).elements.map((e) => e.text)).join(' ');
    assert.ok(text.includes('Brief'));
  });

  it('shows connected status when Slack search is enabled', () => {
    const view = buildAppHomeView({ isSearchEnabled: true });
    const text = view.blocks
      .filter((b) => b.type === 'context')
      .flatMap((b) => /** @type {any} */ (b).elements.map((e) => e.text))
      .join(' ');
    assert.ok(text.includes('connected'));
    assert.ok(!text.includes('not connected'));
  });

  it('shows a warning when Slack search is not enabled', () => {
    const view = buildAppHomeView({ isSearchEnabled: false });
    const text = view.blocks
      .filter((b) => b.type === 'context')
      .flatMap((b) => /** @type {any} */ (b).elements.map((e) => e.text))
      .join(' ');
    assert.ok(text.includes('not connected'));
  });
});
