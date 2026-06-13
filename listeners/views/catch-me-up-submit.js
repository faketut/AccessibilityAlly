import { classifyThread, formatStateBadge } from '../../agent/classifier.js';
import { runAgent } from '../../agent/index.js';
import { getMode } from '../../lib/modes.js';
import { chunkReplyBlocks } from '../../lib/reply-blocks.js';

/**
 * Handle submission of the Catch-me-up mode picker modal.
 *
 * Fetches the source thread, asks the agent to summarize it for the chosen mode,
 * and posts the result back to the user as an ephemeral message in the source channel.
 *
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackViewMiddlewareArgs<import('@slack/bolt').ViewSubmitAction>} args
 */
export async function handleCatchMeUpSubmit({ ack, view, client, body, context, logger }) {
  await ack();

  /** @type {{ channelId: string, threadTs: string, messageTs: string }} */
  const meta = JSON.parse(view.private_metadata || '{}');
  const modeId = view.state.values.mode_block?.mode?.selected_option?.value;
  const focus = view.state.values.focus_block?.focus?.value?.trim() || '';
  const userId = body.user.id;
  const mode = getMode(modeId);

  try {
    // Pull the thread content so we can feed it to the agent.
    const replies = await client.conversations.replies({
      channel: meta.channelId,
      ts: meta.threadTs,
      limit: 200,
    });

    const messages = (replies.messages || [])
      .map((m) => {
        const who = m.user ? `<@${m.user}>` : m.bot_id ? '(bot)' : '(unknown)';
        return `${who}: ${m.text || ''}`;
      })
      .join('\n');

    let permalink = '';
    try {
      const pl = await client.chat.getPermalink({ channel: meta.channelId, message_ts: meta.threadTs });
      permalink = pl.permalink || '';
    } catch {
      /* non-fatal */
    }

    const prompt = [
      `Task: "Catch me up" on the Slack thread below.`,
      `Source channel: <#${meta.channelId}>${permalink ? ` (${permalink})` : ''}`,
      `Active mode: ${mode.label}`,
      focus ? `Reader's specific question: ${focus}` : '',
      '',
      'Thread messages (oldest first):',
      messages,
      '',
      'Produce the output following the ACTIVE MODE; fall back to the DEFAULT OUTPUT TEMPLATE for catch-me-up tasks if the MODE does not override it. Be faithful to the source; if something is unclear, say so.',
    ]
      .filter(Boolean)
      .join('\n');

    // Tell the user we're working (ephemeral, only they see it).
    await client.chat.postEphemeral({
      channel: meta.channelId,
      user: userId,
      thread_ts: meta.threadTs,
      text: `:hourglass_flowing_sand: Translating this thread in *${mode.label}* mode…`,
    });

    const deps = {
      client,
      userId,
      channelId: meta.channelId,
      threadTs: meta.threadTs,
      messageTs: meta.messageTs,
      userToken: context.userToken,
      modeId: mode.id,
    };

    const { responseText } = await runAgent(prompt, deps);

    // Thread state classifier badge. Best-effort; never blocks the summary.
    let stateBadgeText = '';
    try {
      const stateResult = await classifyThread(messages);
      stateBadgeText = formatStateBadge(stateResult).text;
    } catch (err) {
      logger.warn(`State classification failed: ${err}`);
    }

    /** @type {any[]} */
    const blocks = [];
    if (stateBadgeText) {
      blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: stateBadgeText }] });
    }
    for (const b of chunkReplyBlocks(responseText)) {
      blocks.push(b);
    }
    blocks.push({
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `:lock: Only visible to you · Mode: *${mode.label}*` }],
    });

    await client.chat.postEphemeral({
      channel: meta.channelId,
      user: userId,
      thread_ts: meta.threadTs,
      text: responseText || '(no response)',
      blocks,
    });
  } catch (e) {
    logger.error(`Catch-me-up submission failed: ${e}`);
    try {
      await client.chat.postEphemeral({
        channel: meta.channelId,
        user: userId,
        thread_ts: meta.threadTs,
        text: ":warning: Ally couldn't summarize this thread. Try again in a moment.",
      });
    } catch {
      /* swallow */
    }
  }
}
