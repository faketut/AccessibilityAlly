import assert from 'node:assert';
import { describe, it } from 'node:test';

import { DEFAULT_PERSONA_ID, getPersona, PERSONAS, personaPromptFragment } from '../../lib/personas.js';

describe('personas', () => {
  it('exports a non-empty PERSONAS array', () => {
    assert.ok(Array.isArray(PERSONAS));
    assert.ok(PERSONAS.length > 0);
  });

  it('every persona has required fields', () => {
    for (const p of PERSONAS) {
      assert.ok(typeof p.id === 'string' && p.id.length > 0, `id missing on ${JSON.stringify(p)}`);
      assert.ok(typeof p.label === 'string' && p.label.length > 0, `label missing for ${p.id}`);
      assert.ok(typeof p.description === 'string' && p.description.length > 0, `description missing for ${p.id}`);
      assert.ok(typeof p.prompt === 'string' && p.prompt.length > 0, `prompt missing for ${p.id}`);
    }
  });

  it('getPersona returns the matching persona by id', () => {
    for (const p of PERSONAS) {
      const found = getPersona(p.id);
      assert.strictEqual(found.id, p.id);
    }
  });

  it('getPersona falls back to default for unknown id', () => {
    const fallback = getPersona('nonexistent_id_xyz');
    assert.strictEqual(fallback.id, DEFAULT_PERSONA_ID);
  });

  it('getPersona falls back to default for null/undefined', () => {
    assert.strictEqual(getPersona(null).id, DEFAULT_PERSONA_ID);
    assert.strictEqual(getPersona(undefined).id, DEFAULT_PERSONA_ID);
  });

  it('personaPromptFragment returns a non-empty string for every persona', () => {
    for (const p of PERSONAS) {
      const fragment = personaPromptFragment(p.id);
      assert.ok(typeof fragment === 'string' && fragment.length > 0, `empty fragment for ${p.id}`);
      assert.ok(
        fragment.includes('ACTIVE PERSONA') || fragment.includes(p.prompt.slice(0, 10)),
        `fragment for ${p.id} should include persona content`,
      );
    }
  });

  it('personaPromptFragment returns a string for undefined (default persona)', () => {
    const fragment = personaPromptFragment(undefined);
    assert.ok(typeof fragment === 'string' && fragment.length > 0);
  });
});
