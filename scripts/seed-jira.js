#!/usr/bin/env node
/**
 * Seed a Jira Cloud project with demo issues for AccessibilityAlly.
 *
 * Reads:
 *   JIRA_BASE_URL     e.g. https://your-site.atlassian.net
 *   JIRA_EMAIL        Atlassian account email
 *   JIRA_API_TOKEN    https://id.atlassian.com/manage-profile/security/api-tokens
 *   JIRA_PROJECT_KEY  e.g. AUTH (optional; auto-detected if omitted)
 *
 * Usage:
 *   npm run seed:jira
 *   npm run seed:jira -- --file ./scripts/jira-seed.json
 *
 * Re-running creates duplicate issues. For a clean reset, delete the project
 * in the Atlassian UI (Project settings -> Details -> Move to trash) and recreate.
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const DEFAULT_SEED_PATH = resolve(process.cwd(), 'scripts/jira-seed.json');

function parseArgs(argv) {
  const out = { file: DEFAULT_SEED_PATH };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--file' && argv[i + 1]) {
      out.file = resolve(process.cwd(), argv[i + 1]);
      i += 1;
    }
  }
  return out;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return v.trim().replace(/\/$/, '');
}

function adfFromText(text) {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: String(text ?? '') }],
      },
    ],
  };
}

async function jiraFetch(base, auth, path, init = {}) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const bodyText = await res.text();
  let body;
  try {
    body = bodyText ? JSON.parse(bodyText) : {};
  } catch {
    body = { raw: bodyText };
  }
  if (!res.ok) {
    const err = new Error(`${init.method || 'GET'} ${path} -> ${res.status}`);
    err.body = body;
    throw err;
  }
  return body;
}

async function transitionIssue(base, auth, key, targetName) {
  const { transitions } = await jiraFetch(base, auth, `/rest/api/3/issue/${encodeURIComponent(key)}/transitions`);
  const match = (transitions || []).find((t) => t.name && t.name.toLowerCase() === targetName.toLowerCase());
  if (!match) {
    const available = (transitions || []).map((t) => t.name).join(', ');
    throw new Error(`No transition named "${targetName}" on ${key}. Available: ${available}`);
  }
  await jiraFetch(base, auth, `/rest/api/3/issue/${encodeURIComponent(key)}/transitions`, {
    method: 'POST',
    body: JSON.stringify({ transition: { id: match.id } }),
  });
}

async function resolveProjectKey(base, auth) {
  const explicit = process.env.JIRA_PROJECT_KEY?.trim();
  if (explicit) {
    await jiraFetch(base, auth, `/rest/api/3/project/${encodeURIComponent(explicit)}`);
    console.log(`Project ${explicit} found on ${base}`);
    return explicit;
  }

  const list = await jiraFetch(base, auth, '/rest/api/3/project/search?maxResults=50&fields=key,name');
  const values = Array.isArray(list?.values) ? list.values : [];
  if (values.length === 0) {
    throw new Error('No Jira projects found. Create one in Jira first, or set JIRA_PROJECT_KEY.');
  }

  const first = values[0];
  const autoKey = first?.key;
  if (!autoKey) {
    throw new Error('Could not auto-detect a project key from Jira project list.');
  }

  console.log(`JIRA_PROJECT_KEY not set; auto-selected ${autoKey} (${first?.name || 'Unnamed project'})`);
  return autoKey;
}

async function main() {
  const { file } = parseArgs(process.argv.slice(2));

  const base = requireEnv('JIRA_BASE_URL');
  const email = requireEnv('JIRA_EMAIL');
  const token = requireEnv('JIRA_API_TOKEN');
  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  // Sanity-check credentials before mutating anything.
  const me = await jiraFetch(base, auth, '/rest/api/3/myself');
  console.log(`Authenticated as ${me.displayName} <${me.emailAddress || email}>`);
  const projectKey = await resolveProjectKey(base, auth);

  const raw = await readFile(file, 'utf8');
  /** @type {Array<{summary: string, description?: string, issueType?: string, transition?: string}>} */
  const seed = JSON.parse(raw);
  if (!Array.isArray(seed) || seed.length === 0) {
    console.error(`Seed file ${file} is empty or not an array.`);
    process.exit(1);
  }

  const created = [];
  for (const item of seed) {
    if (!item?.summary) {
      console.warn('Skipping seed item without summary:', item);
      continue;
    }
    const body = {
      fields: {
        project: { key: projectKey },
        summary: item.summary,
        issuetype: { name: item.issueType || 'Task' },
        description: adfFromText(item.description || ''),
      },
    };
    try {
      const res = await jiraFetch(base, auth, '/rest/api/3/issue', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const key = res.key;
      console.log(`  + ${key}  ${item.summary}`);
      created.push({ key, summary: item.summary, transition: item.transition });
    } catch (err) {
      console.error(`  ! Failed to create "${item.summary}":`, err.body || err.message);
    }
  }

  for (const c of created) {
    if (!c.transition) continue;
    try {
      await transitionIssue(base, auth, c.key, c.transition);
      console.log(`  > ${c.key} transitioned to "${c.transition}"`);
    } catch (err) {
      console.error(`  ! Transition failed for ${c.key}:`, err.message);
    }
  }

  console.log(`\nDone. Created ${created.length} issue(s) in ${projectKey}.`);
  console.log(`Reference these in a Slack thread (e.g. "blocked on ${projectKey}-1") and run "Catch me up".`);
}

main().catch((err) => {
  console.error('Seed failed:', err.body || err);
  process.exit(1);
});
