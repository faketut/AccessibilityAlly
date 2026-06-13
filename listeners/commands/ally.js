import { runAgent } from '../../agent/index.js';
import { getMode, MODES } from '../../lib/modes.js';
import { getPrefs, setPrefs } from '../../lib/prefs.js';

const HELP = [
  '*AccessibilityAlly commands*',
  '• `/ally mode <translate|brief|onboard|simplify>` — set your default mode',
  '• `/ally mode` — show your current mode',
  '• `/ally plainify <text>` — rewrite a snippet in plain language',
  '• `/ally help` — show this help',
  '',
  '_Tip: right-click any thread → More actions → "Catch me up" for the full summary._',
].join('\n');

/**
 * Handle the /ally slash command.
 * @param {import('@slack/bolt').SlackCommandMiddlewareArgs & import('@slack/bolt').AllMiddlewareArgs} args
 */
export async function handleAllyCommand({ ack, command, respond, client, context, logger }) {
  await ack();
  const userId = command.user_id;
  const raw = (command.text || '').trim();
  const [sub, ...rest] = raw.split(/\s+/);
  const arg = rest.join(' ').trim();

  try {
    if (!sub || sub === 'help') {
      await respond({ response_type: 'ephemeral', text: HELP });
      return;
    }

    if (sub === 'mode') {
      if (!arg) {
        const current = getMode(getPrefs(userId).mode);
        await respond({
          response_type: 'ephemeral',
          text: `Your current mode is *${current.label}*. Change it with \`/ally mode translate|brief|onboard|simplify\`.`,
        });
        return;
      }
      const match = MODES.find((m) => m.id === arg);
      if (!match) {
        await respond({
          response_type: 'ephemeral',
          text: `Unknown mode \`${arg}\`. Choose one of: ${MODES.map((m) => `\`${m.id}\``).join(', ')}.`,
        });
        return;
      }
      setPrefs(userId, { mode: match.id });
      await respond({
        response_type: 'ephemeral',
        text: `:white_check_mark: Mode set to *${match.label}*. I'll use this when you say "catch me up".`,
      });
      return;
    }

    if (sub === 'plainify') {
      if (!arg) {
        await respond({ response_type: 'ephemeral', text: 'Usage: `/ally plainify <text to rewrite>`' });
        return;
      }
      const modeId = getPrefs(userId).mode ?? 'simplify';
      const deps = {
        client,
        userId,
        channelId: command.channel_id,
        threadTs: '',
        messageTs: '',
        userToken: context.userToken,
        modeId,
      };
      const prompt = [
        'Task: rewrite the snippet below according to the ACTIVE MODE.',
        'Keep meaning intact. Define every acronym on first use.',
        'Do NOT use the catch-me-up template — output just the rewritten text, then a Glossary section if needed.',
        '',
        'Snippet:',
        arg,
      ].join('\n');
      const { responseText } = await runAgent(prompt, deps);
      await respond({ response_type: 'ephemeral', text: responseText || '(no response)' });
      return;
    }

    await respond({ response_type: 'ephemeral', text: `Unknown subcommand \`${sub}\`.\n\n${HELP}` });
  } catch (e) {
    logger.error(`/ally command failed: ${e}`);
    await respond({ response_type: 'ephemeral', text: `:warning: Ally hit an error: ${e}` });
  }
}
