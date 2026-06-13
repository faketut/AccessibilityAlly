import { runAgent } from '../../agent/index.js';
import { getPersona, PERSONAS } from '../../lib/personas.js';
import { getPrefs, setPrefs } from '../../lib/prefs.js';

const HELP = [
  '*AccessibilityAlly commands*',
  '• `/ally persona <translate|brief|onboard|simplify>` — set your default audience',
  '• `/ally persona` — show your current persona',
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

    if (sub === 'persona') {
      if (!arg) {
        const current = getPersona(getPrefs(userId).persona);
        await respond({
          response_type: 'ephemeral',
          text: `Your current audience persona is *${current.label}*. Change it with \`/ally persona translate|brief|onboard|simplify\`.`,
        });
        return;
      }
      const match = PERSONAS.find((p) => p.id === arg);
      if (!match) {
        await respond({
          response_type: 'ephemeral',
          text: `Unknown persona \`${arg}\`. Choose one of: ${PERSONAS.map((p) => `\`${p.id}\``).join(', ')}.`,
        });
        return;
      }
      setPrefs(userId, { persona: match.id });
      await respond({
        response_type: 'ephemeral',
        text: `:white_check_mark: Audience set to *${match.label}*. I'll use this when you say "catch me up".`,
      });
      return;
    }

    if (sub === 'plainify') {
      if (!arg) {
        await respond({ response_type: 'ephemeral', text: 'Usage: `/ally plainify <text to rewrite>`' });
        return;
      }
      const personaId = getPrefs(userId).persona ?? 'simplify';
      const deps = {
        client,
        userId,
        channelId: command.channel_id,
        threadTs: '',
        messageTs: '',
        userToken: context.userToken,
        personaId,
      };
      const prompt = [
        "Task: rewrite the snippet below according to the ACTIVE PERSONA's MODE.",
        'Keep meaning intact. Define every acronym on first use.',
        'Do NOT use the catch-me-up template — output just the rewritten text, then a Glossary section if needed.',
        '',
        'Snippet:',
        arg,
      ].join('\n');
      const { responseText } = await runAgent(prompt, undefined, deps);
      await respond({ response_type: 'ephemeral', text: responseText || '(no response)' });
      return;
    }

    await respond({ response_type: 'ephemeral', text: `Unknown subcommand \`${sub}\`.\n\n${HELP}` });
  } catch (e) {
    logger.error(`/ally command failed: ${e}`);
    await respond({ response_type: 'ephemeral', text: `:warning: Ally hit an error: ${e}` });
  }
}
