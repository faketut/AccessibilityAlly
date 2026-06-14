/**
 * Tiny JSON-file user preferences store.
 *
 * Scope: hackathon demo. Single workspace, single process. Not safe for concurrent
 * multi-instance writes — fine for `slack run` development and a single sandbox.
 */

import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const STORE_PATH = resolve(process.cwd(), '.ally-data', 'user-prefs.json');

/** @typedef {{ mode?: string }} UserPrefs */

/** @type {Record<string, UserPrefs>} */
let cache = {};
let loaded = false;

/** @returns {Record<string, UserPrefs>} */
function load() {
  if (loaded) return cache;
  try {
    cache = JSON.parse(readFileSync(STORE_PATH, 'utf8'));
  } catch {
    cache = {};
  }
  loaded = true;
  return cache;
}

function persist() {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  // Write to a temp file in the same directory, then atomic rename so a crash
  // mid-write can't leave the prefs file half-truncated.
  const tmp = `${STORE_PATH}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(cache, null, 2));
  renameSync(tmp, STORE_PATH);
}

/**
 * @param {string} userId
 * @returns {UserPrefs}
 */
export function getPrefs(userId) {
  return load()[userId] ?? {};
}

/**
 * @param {string} userId
 * @param {Partial<UserPrefs>} patch
 * @returns {UserPrefs}
 */
export function setPrefs(userId, patch) {
  const all = load();
  all[userId] = { ...(all[userId] ?? {}), ...patch };
  persist();
  return all[userId];
}
