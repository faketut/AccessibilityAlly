import { runAgent } from '../../agent/index.js';
import { getPrefs } from '../../lib/prefs.js';
import { sessionStore } from '../../thread-context/index.js';
import { buildFeedbackBlocks } from '../views/feedback-builder.js';

/**
 * Handle app_mention events and run the agent.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'app_mention'>} args
 */
export async function handleAppMentioned({ client, context, event, logger, say, sayStream, setStatus }) {
  try {
    const channelId = event.channel;
    const text = event.text || '';
    const threadTs = event.thread_ts || event.ts;
    const userId = /** @type {string} */ (context.userId);

    const cleanedText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!cleanedText) {
      await say({
        text: "Hi — I'm Ally. Try `/ally help` or right-click a thread → *Catch me up*.",
        thread_ts: threadTs,
      });
      return;
    }

    await setStatus({
      status: 'Translating\u2026',
      loading_messages: [
        'Reading the thread carefully\u2026',
        'Looking up acronyms\u2026',
        'Finding owners and decisions\u2026',
        'Writing for your audience\u2026',
      ],
    });

    const existingSessionId = sessionStore.getSession(channelId, threadTs);
    const personaId = getPrefs(userId).persona;
    const deps = {
      client,
      userId,
      channelId,
      threadTs,
      messageTs: event.ts,
      userToken: context.userToken,
      personaId,
    };
    const { responseText, sessionId: newSessionId } = await runAgent(cleanedText, existingSessionId ?? undefined, deps);

    const streamer = sayStream();
    await streamer.append({ markdown_text: responseText });
    const feedbackBlocks = buildFeedbackBlocks();
    await streamer.stop({ blocks: feedbackBlocks });

    if (newSessionId) {
      sessionStore.setSession(channelId, threadTs, newSessionId);
    }
  } catch (e) {
    logger.error(`Failed to handle app mention: ${e}`);
    await say({
      text: ":warning: Ally hit an error and couldn't reply. Try again in a moment.",
      thread_ts: event.thread_ts || event.ts,
    });
  }
}
