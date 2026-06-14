import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { fetchJiraIssue, searchSlack } from '../../agent/tools.js';

const origFetch = globalThis.fetch;
const origEnv = { ...process.env };

/**
 * Build a stub Response-like object that has the bits tools.js touches.
 * @param {{ status?: number, json?: unknown, retryAfter?: string }} init
 */
function mockResponse({ status = 200, json = {}, retryAfter } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k) => (k.toLowerCase() === 'retry-after' && retryAfter ? retryAfter : null) },
    json: async () => json,
  };
}

describe('searchSlack', () => {
  beforeEach(() => {
    process.env = { ...origEnv, SLACK_USER_TOKEN: 'xoxp-test' };
  });
  afterEach(() => {
    globalThis.fetch = origFetch;
    process.env = origEnv;
  });

  it('returns error when query is missing', async () => {
    const out = await searchSlack({});
    assert.strictEqual(out.error, 'missing query');
  });

  it('returns error when SLACK_USER_TOKEN is not set', async () => {
    process.env.SLACK_USER_TOKEN = '';
    const out = await searchSlack({ query: 'auth' });
    assert.strictEqual(out.error, 'Slack user token not configured');
  });

  it('returns mapped results on success', async () => {
    globalThis.fetch = async () =>
      mockResponse({
        json: {
          ok: true,
          messages: {
            matches: [{ channel: { name: 'general' }, user: 'U1', ts: '1.0', text: 'hello', permalink: 'https://x' }],
          },
        },
      });
    const out = await searchSlack({ query: 'auth', count: 3 });
    assert.deepStrictEqual(out.results, [
      { channel: 'general', user: 'U1', ts: '1.0', text: 'hello', permalink: 'https://x' },
    ]);
  });

  it('truncates long match text to 400 chars', async () => {
    const long = 'x'.repeat(1000);
    globalThis.fetch = async () =>
      mockResponse({
        json: { ok: true, messages: { matches: [{ channel: { name: 'g' }, text: long }] } },
      });
    const out = await searchSlack({ query: 'q' });
    assert.strictEqual(out.results[0].text.length, 400);
  });

  it('reports Slack-level errors', async () => {
    globalThis.fetch = async () => mockResponse({ json: { ok: false, error: 'invalid_auth' } });
    const out = await searchSlack({ query: 'q' });
    assert.strictEqual(out.error, 'Slack search error: invalid_auth');
  });

  it('retries once on 429, then succeeds', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls += 1;
      if (calls === 1) return mockResponse({ status: 429, retryAfter: '0' });
      return mockResponse({ json: { ok: true, messages: { matches: [] } } });
    };
    const out = await searchSlack({ query: 'q' });
    assert.strictEqual(calls, 2);
    assert.deepStrictEqual(out.results, []);
  });

  it('returns http-level error when both attempts fail', async () => {
    globalThis.fetch = async () => mockResponse({ status: 503, retryAfter: '0' });
    const out = await searchSlack({ query: 'q' });
    assert.strictEqual(out.error, 'Slack search failed (503)');
  });
});

describe('fetchJiraIssue', () => {
  beforeEach(() => {
    process.env = {
      ...origEnv,
      JIRA_BASE_URL: 'https://example.atlassian.net',
      JIRA_EMAIL: 'me@example.com',
      JIRA_API_TOKEN: 'tok',
    };
  });
  afterEach(() => {
    globalThis.fetch = origFetch;
    process.env = origEnv;
  });

  it('returns error when key is missing', async () => {
    const out = await fetchJiraIssue({});
    assert.strictEqual(out.error, 'missing key');
  });

  it('returns error when Jira creds are missing', async () => {
    delete process.env.JIRA_API_TOKEN;
    const out = await fetchJiraIssue({ key: 'KAN-1' });
    assert.strictEqual(out.error, 'Jira credentials not configured');
  });

  it('returns summarized issue on success', async () => {
    globalThis.fetch = async () =>
      mockResponse({
        json: {
          fields: {
            summary: 'Auth rollout',
            status: { name: 'In Progress' },
            assignee: { displayName: 'Sam' },
          },
        },
      });
    const out = await fetchJiraIssue({ key: 'KAN-5' });
    assert.strictEqual(out.key, 'KAN-5');
    assert.strictEqual(out.title, 'Auth rollout');
    assert.strictEqual(out.status, 'In Progress');
    assert.strictEqual(out.assignee, 'Sam');
    assert.strictEqual(out.url, 'https://example.atlassian.net/browse/KAN-5');
  });

  it('defaults assignee when issue is unassigned', async () => {
    globalThis.fetch = async () => mockResponse({ json: { fields: { summary: 's', status: { name: 'To Do' } } } });
    const out = await fetchJiraIssue({ key: 'KAN-9' });
    assert.strictEqual(out.assignee, 'Unassigned');
  });

  it('returns http-level error on persistent 500', async () => {
    globalThis.fetch = async () => mockResponse({ status: 500, retryAfter: '0' });
    const out = await fetchJiraIssue({ key: 'KAN-1' });
    assert.strictEqual(out.error, 'Jira fetch failed (500)');
  });
});
