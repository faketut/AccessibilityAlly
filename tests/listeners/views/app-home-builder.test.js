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

  it('includes a mode radio-button picker with one option per mode', () => {
    const view = buildAppHomeView();
    const actions = view.blocks.find((b) => b.type === 'actions' && /** @type {any} */ (b).block_id === 'mode_actions');
    assert.ok(actions, 'expected mode_actions block');
    const radios = /** @type {any} */ (actions).elements[0];
    assert.strictEqual(radios.type, 'radio_buttons');
    assert.strictEqual(radios.action_id, 'set_mode');
    assert.strictEqual(radios.options.length, MODES.length);
  });

  it('marks the supplied current mode as the initial option', () => {
    const view = buildAppHomeView({ currentModeId: 'simplify' });
    const actions = view.blocks.find((b) => b.type === 'actions' && /** @type {any} */ (b).block_id === 'mode_actions');
    const radios = /** @type {any} */ (actions).elements[0];
    assert.strictEqual(radios.initial_option.value, 'simplify');
  });

  it('shows connected status when MCP is connected', () => {
    const view = buildAppHomeView({ isMcpConnected: true });
    const text = view.blocks
      .filter((b) => b.type === 'context')
      .flatMap((b) => /** @type {any} */ (b).elements.map((e) => e.text))
      .join(' ');
    assert.ok(text.includes('connected'));
    assert.ok(!text.includes('not connected'));
  });

  it('shows a warning when MCP is not connected', () => {
    const view = buildAppHomeView({ isMcpConnected: false });
    const text = view.blocks
      .filter((b) => b.type === 'context')
      .flatMap((b) => /** @type {any} */ (b).elements.map((e) => e.text))
      .join(' ');
    assert.ok(text.includes('not connected'));
  });
});
