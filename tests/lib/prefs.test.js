import assert from 'node:assert';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

// Isolate each test by pointing the store at a temp directory.
// We do this by overriding process.cwd() via an environment detour:
// prefs.js resolves STORE_PATH from process.cwd(), so we change cwd() per test.

// Because prefs.js is a module with module-level state (cache / loaded),
// we can only reset it across tests by reimporting a fresh module each time.
// We achieve this with dynamic import() which Node caches per specifier —
// so we need a per-test unique query string to bust the cache.

const PREFS_PATH = resolve(import.meta.dirname, '../../lib/prefs.js');

let tmpDir = '';
const origCwd = process.cwd;

describe('prefs store', () => {
  beforeEach(() => {
    tmpDir = join(os.tmpdir(), `ally-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpDir, { recursive: true });
    // Redirect process.cwd() so prefs.js resolves STORE_PATH under tmpDir
    process.cwd = () => tmpDir;
  });

  afterEach(() => {
    process.cwd = origCwd;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getPrefs returns empty object for unknown user', async () => {
    const { getPrefs } = await import(`${PREFS_PATH}?t=${Date.now()}`);
    const prefs = getPrefs('U_UNKNOWN');
    assert.deepStrictEqual(prefs, {});
  });

  it('setPrefs persists and getPrefs reads back', async () => {
    const { getPrefs, setPrefs } = await import(`${PREFS_PATH}?t=${Date.now()}`);
    setPrefs('U123', { persona: 'brief' });
    const prefs = getPrefs('U123');
    assert.strictEqual(prefs.persona, 'brief');
  });

  it('setPrefs merges patch with existing prefs', async () => {
    const { getPrefs, setPrefs } = await import(`${PREFS_PATH}?t=${Date.now()}`);
    setPrefs('U123', { persona: 'translate' });
    setPrefs('U123', { persona: 'simplify' });
    assert.strictEqual(getPrefs('U123').persona, 'simplify');
  });

  it('loads from pre-existing JSON file on first read', async () => {
    mkdirSync(join(tmpDir, '.ally-data'), { recursive: true });
    writeFileSync(join(tmpDir, '.ally-data', 'user-prefs.json'), JSON.stringify({ UPRE: { persona: 'onboard' } }));
    const { getPrefs } = await import(`${PREFS_PATH}?t=${Date.now()}`);
    assert.strictEqual(getPrefs('UPRE').persona, 'onboard');
  });

  it('tolerates a missing or corrupt JSON file', async () => {
    mkdirSync(join(tmpDir, '.ally-data'), { recursive: true });
    writeFileSync(join(tmpDir, '.ally-data', 'user-prefs.json'), 'not json{{{');
    const { getPrefs } = await import(`${PREFS_PATH}?t=${Date.now()}`);
    assert.deepStrictEqual(getPrefs('U_ANY'), {});
  });
});
