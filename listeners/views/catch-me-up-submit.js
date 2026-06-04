import { runAgent } from '../../agent/index.js';
import { getPersona } from '../../lib/personas.js';

/**
 * Handle submission of the Catch-me-up persona picker modal.
 *
 * Fetches the source thread, asks the agent to summarize it for the chosen persona,
 * and posts the result back to the user as an ephemeral message in the source channel.
 *
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackViewMiddlewareArgs<import('@slack/bolt').ViewSubmitAction>} args
 */
export async function handleCatchMeUpSubmit({ ack, view, client, body, context, logger }) {
  await ack();

  /** @type {{ channelId: string, threadTs: string, messageTs: string }} */
  const meta = JSON.parse(view.private_metadata || '{}');
  const personaId = view.state.values.persona_block?.persona?.selected_option?.value;
  const focus = view.state.values.focus_block?.focus?.value?.trim() || '';
  const userId = body.user.id;
  const persona = getPersona(personaId);

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
      `Audience persona: ${persona.label}`,
      focus ? `Reader's specific question: ${focus}` : '',
      '',
      'Thread messages (oldest first):',
      messages,
      '',
      `Produce the output in the "OUTPUT TEMPLATE for catch-me-up tasks" format. Be faithful to the source; if something is unclear, say so.`,
    ]
      .filter(Boolean)
      .join('\n');

    // Tell the user we're working (ephemeral, only they see it).
    await client.chat.postEphemeral({
      channel: meta.channelId,
      user: userId,
      thread_ts: meta.threadTs,
      text: `:hourglass_flowing_sand: Translating this thread for *${persona.label}*…`,
    });

    const deps = {
      client,
      userId,
      channelId: meta.channelId,
      threadTs: meta.threadTs,
      messageTs: meta.messageTs,
      userToken: context.userToken,
      personaId: persona.id,
    };

    const { responseText } = await runAgent(prompt, undefined, deps);

    await client.chat.postEphemeral({
      channel: meta.channelId,
      user: userId,
      thread_ts: meta.threadTs,
      text: responseText || '(no response)',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: responseText || '(no response)' },
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `:lock: Only visible to you · Audience: *${persona.label}*` }],
        },
      ],
    });
  } catch (e) {
    logger.error(`Catch-me-up submission failed: ${e}`);
    try {
      await client.chat.postEphemeral({
        channel: meta.channelId,
        user: userId,
        thread_ts: meta.threadTs,
        text: `:warning: Ally couldn't summarize this thread: ${e}`,
      });
    } catch {
      /* swallow */
    }
  }
}
