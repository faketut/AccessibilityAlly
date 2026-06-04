const SUGGESTED_PROMPTS = [
  {
    title: 'Catch me up on a channel',
    message: 'Search recent messages in #engineering and summarize the active threads for me.',
  },
  {
    title: 'Explain this jargon',
    message:
      'I keep seeing "Phoenix migration" mentioned. Search the workspace and explain what it is in plain English.',
  },
  {
    title: 'Who owns this?',
    message:
      'Who is currently leading the work on auth refactoring? Look across recent threads and tell me how to reach them.',
  },
];

/**
 * Handle assistant_thread_started events by setting Ally-flavored suggested prompts.
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'assistant_thread_started'>} args
 */
export async function handleAssistantThreadStarted({ client, event, logger }) {
  const { channel_id: channelId, thread_ts: threadTs } = event.assistant_thread;
  try {
    await client.assistant.threads.setSuggestedPrompts({
      channel_id: channelId,
      thread_ts: threadTs,
      title: 'What can I translate for you?',
      prompts: SUGGESTED_PROMPTS,
    });
  } catch (e) {
    logger.error(`Failed to handle assistant thread started: ${e}`);
  }
}
