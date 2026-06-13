import assert from 'node:assert';
import { describe, it } from 'node:test';

import { DEFAULT_MODE_ID, getMode, MODES, modePromptFragment } from '../../lib/modes.js';

describe('modes', () => {
  it('exports a non-empty MODES array', () => {
    assert.ok(Array.isArray(MODES));
    assert.ok(MODES.length > 0);
  });

  it('every mode has required fields', () => {
    for (const m of MODES) {
      assert.ok(typeof m.id === 'string' && m.id.length > 0, `id missing on ${JSON.stringify(m)}`);
      assert.ok(typeof m.label === 'string' && m.label.length > 0, `label missing for ${m.id}`);
      assert.ok(typeof m.description === 'string' && m.description.length > 0, `description missing for ${m.id}`);
      assert.ok(typeof m.prompt === 'string' && m.prompt.length > 0, `prompt missing for ${m.id}`);
    }
  });

  it('getMode returns the matching mode by id', () => {
    for (const m of MODES) {
      const found = getMode(m.id);
      assert.strictEqual(found.id, m.id);
    }
  });

  it('getMode falls back to default for unknown id', () => {
    const fallback = getMode('nonexistent_id_xyz');
    assert.strictEqual(fallback.id, DEFAULT_MODE_ID);
  });

  it('getMode falls back to default for null/undefined', () => {
    assert.strictEqual(getMode(null).id, DEFAULT_MODE_ID);
    assert.strictEqual(getMode(undefined).id, DEFAULT_MODE_ID);
  });

  it('modePromptFragment returns a non-empty string for every mode', () => {
    for (const m of MODES) {
      const fragment = modePromptFragment(m.id);
      assert.ok(typeof fragment === 'string' && fragment.length > 0, `empty fragment for ${m.id}`);
      assert.ok(
        fragment.includes('ACTIVE MODE') || fragment.includes(m.prompt.slice(0, 10)),
        `fragment for ${m.id} should include mode content`,
      );
    }
  });

  it('modePromptFragment returns a string for undefined (default mode)', () => {
    const fragment = modePromptFragment(undefined);
    assert.ok(typeof fragment === 'string' && fragment.length > 0);
  });
});
