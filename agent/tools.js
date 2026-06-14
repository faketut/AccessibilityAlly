// Cap how much we hand back to the model from a single Slack search hit; keeps
// the function-response tokens predictable and avoids dumping novels into the prompt.
const MAX_RESULT_TEXT_CHARS = 400;

// Retry once on 429 / 5xx. Backoff is capped so a slow Jira can't stall the agent.
const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const MAX_RETRY_DELAY_MS = 2000;

/**
 * @param {string} url
 * @param {RequestInit} init
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(url, init) {
  const first = await fetch(url, init);
  if (!RETRY_STATUS.has(first.status)) return first;

  const retryAfter = Number(first.headers.get('retry-after'));
  const delayMs = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, MAX_RETRY_DELAY_MS) : 500;
  await new Promise((r) => setTimeout(r, delayMs));
  return fetch(url, init);
}

/**
 * Search Slack messages with the configured user token so results respect that user's access.
 * @param {{ query?: string, count?: number }} args
 * @returns {Promise<{ results?: Array<{ channel: string, user: string, ts: string, text: string, permalink: string }>, error?: string }>}
 */
export async function searchSlack(args) {
  const query = args?.query?.trim();
  if (!query) return { error: 'missing query' };

  const token = process.env.SLACK_USER_TOKEN;
  if (!token) return { error: 'Slack user token not configured' };

  const count = Number.isFinite(args?.count) ? Math.max(1, Math.min(10, Number(args.count))) : 5;
  const body = new URLSearchParams({ query, count: String(count), sort: 'timestamp' });

  const res = await fetchWithRetry('https://slack.com/api/search.messages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!res.ok) {
    return { error: `Slack search failed (${res.status})` };
  }

  const json = await res.json();
  if (!json.ok) {
    return { error: `Slack search error: ${json.error || 'unknown_error'}` };
  }

  /** @type {any[]} */
  const matches = Array.isArray(json?.messages?.matches) ? json.messages.matches : [];
  return {
    results: matches.slice(0, count).map((m) => ({
      channel: m?.channel?.name || '',
      user: m?.username || m?.user || '',
      ts: m?.ts || '',
      text: typeof m?.text === 'string' ? m.text.slice(0, MAX_RESULT_TEXT_CHARS) : '',
      permalink: m?.permalink || '',
    })),
  };
}

/**
 * Fetch a Jira issue summary for citation.
 * @param {{ key?: string }} args
 * @returns {Promise<{ key?: string, title?: string, status?: string, assignee?: string, url?: string, error?: string }>}
 */
export async function fetchJiraIssue(args) {
  const key = args?.key?.trim();
  if (!key) return { error: 'missing key' };

  const base = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!base || !email || !token) {
    return { error: 'Jira credentials not configured' };
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  const url = `${base.replace(/\/$/, '')}/rest/api/3/issue/${encodeURIComponent(key)}?fields=summary,status,assignee`;
  const res = await fetchWithRetry(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    return { error: `Jira fetch failed (${res.status})` };
  }

  const json = await res.json();
  return {
    key,
    title: json?.fields?.summary || '',
    status: json?.fields?.status?.name || '',
    assignee: json?.fields?.assignee?.displayName || 'Unassigned',
    url: `${base.replace(/\/$/, '')}/browse/${encodeURIComponent(key)}`,
  };
}
