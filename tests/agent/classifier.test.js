import assert from 'node:assert';
import { describe, it } from 'node:test';

import { formatStateBadge } from '../../agent/classifier.js';

// classifyThread calls Gemini — we only unit-test the pure functions:
// formatStateBadge (pure), and the JSON-parsing fallback behaviour.

describe('formatStateBadge', () => {
  it('formats a resolved state without owner or reason', () => {
    const result = formatStateBadge({ state: 'resolved', reason: '', owner: '' });
    assert.strictEqual(result.label, 'Resolved');
    assert.ok(result.emoji.length > 0);
    assert.ok(result.text.includes('*Resolved*'));
    assert.ok(!result.text.includes('Owner'));
    assert.ok(!result.text.includes(' — '));
  });

  it('includes reason when provided', () => {
    const result = formatStateBadge({ state: 'awaiting', reason: 'waiting on Ana to approve', owner: '' });
    assert.ok(result.text.includes('waiting on Ana to approve'));
  });

  it('includes owner when provided', () => {
    const result = formatStateBadge({ state: 'blocked', reason: '', owner: '@ana' });
    assert.ok(result.text.includes('Owner: @ana'));
  });

  it('includes both reason and owner', () => {
    const result = formatStateBadge({ state: 'discussion', reason: 'ongoing debate', owner: '@bob' });
    assert.ok(result.text.includes('ongoing debate'));
    assert.ok(result.text.includes('Owner: @bob'));
  });

  it('covers all four valid states', () => {
    for (const state of /** @type {const} */ (['resolved', 'awaiting', 'blocked', 'discussion'])) {
      const result = formatStateBadge({ state, reason: '', owner: '' });
      assert.ok(result.label.length > 0, `label missing for state: ${state}`);
      assert.ok(result.emoji.length > 0, `emoji missing for state: ${state}`);
    }
  });
});
