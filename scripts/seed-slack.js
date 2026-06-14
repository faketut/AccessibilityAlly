#!/usr/bin/env node
/**
 * Seed a Slack channel with a demo thread for AccessibilityAlly.
 *
 * Reads:
 *   SLACK_USER_TOKEN  preferred (lets the script post as you and pin)
 *   SLACK_BOT_TOKEN   fallback (must be invited to the channel first)
 *
 * Usage:
 *   npm run seed:slack
 *   npm run seed:slack -- --channel "#backend-platform" --file ./scripts/slack-seed.json
 */

import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { webApi } from '@slack/bolt';

const { WebClient } = webApi;

const DEFAULT_SEED_PATH = resolve(process.cwd(), 'scripts/slack-seed.json');
const DEFAULT_CHANNEL = '#backend-platform';

function parseArgs(argv) {
  const out = { file: DEFAULT_SEED_PATH, channel: DEFAULT_CHANNEL };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--file' && argv[i + 1]) {
      out.file = resolve(process.cwd(), argv[i + 1]);
      i += 1;
    } else if (argv[i] === '--channel' && argv[i + 1]) {
      out.channel = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

async function resolveChannel(slack, ref) {
  if (/^[CG][A-Z0-9]+$/.test(ref)) return { id: ref, isMember: true };

  const name = ref.replace(/^#/, '');
  const { channels } = await slack.conversations.list({
    exclude_archived: true,
    types: 'public_channel,private_channel',
    limit: 1000,
  });
  const match = (channels || []).find((c) => c.name === name);
  if (!match) {
    throw new Error(`Channel "${ref}" not found. Create it in Slack first or pass an ID.`);
  }
  return { id: match.id, isMember: Boolean(match.is_member) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const token = process.env.SLACK_USER_TOKEN || process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error('Missing required env var: SLACK_USER_TOKEN or SLACK_BOT_TOKEN');
    process.exit(1);
  }

  const raw = await readFile(args.file, 'utf8');
  /** @type {{ messages: string[] }} */
  const seed = JSON.parse(raw);
  if (!Array.isArray(seed.messages) || seed.messages.length === 0) {
    console.error(`Seed file ${args.file} must have a non-empty "messages" array.`);
    process.exit(1);
  }

  const slack = new WebClient(token);
  const channel = await resolveChannel(slack, args.channel);
  console.log(`Using channel ${args.channel} (${channel.id})`);

  if (!channel.isMember) {
    try {
      await slack.conversations.join({ channel: channel.id });
    } catch (err) {
      console.warn(`Could not auto-join ${args.channel}: ${err.message}. Invite the poster manually.`);
    }
  }

  let threadTs;
  for (const [i, text] of seed.messages.entries()) {
    const res = await slack.chat.postMessage({
      channel: channel.id,
      text,
      thread_ts: threadTs,
    });
    if (i === 0) {
      threadTs = res.ts;
      console.log(`  + thread root ${threadTs}`);
      try {
        await slack.pins.add({ channel: channel.id, timestamp: threadTs });
        console.log('  > pinned thread root');
      } catch (err) {
        console.warn(`  ! pin failed: ${err.message} (continuing)`);
      }
    } else {
      console.log(`  + reply ${res.ts}`);
    }
  }

  console.log(`\nDone. Seeded ${seed.messages.length} message(s) in ${args.channel}.`);
  console.log('Right-click the pinned message and run "Catch me up" to demo.');
}

main().catch((err) => {
  console.error('Seed failed:', err.data || err.message || err);
  process.exit(1);
});
