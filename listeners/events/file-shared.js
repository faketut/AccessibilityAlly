import { describeImage } from '../../agent/vision.js';

const IMAGE_MIMETYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB — keep Gemini calls cheap and fast.

/**
 * On file_shared: download the file, ask Gemini for alt text, post it as a thread reply.
 * Bot user must be in the channel for files.info to return a download URL.
 *
 * @param {import('@slack/bolt').AllMiddlewareArgs & import('@slack/bolt').SlackEventMiddlewareArgs<'file_shared'>} args
 */
export async function handleFileShared({ client, context, event, logger }) {
  try {
    const info = await client.files.info({ file: event.file_id });
    const file = info.file;
    if (!file) return;

    const mimetype = (file.mimetype || '').toLowerCase();
    if (!IMAGE_MIMETYPES.has(mimetype)) return;
    if ((file.size ?? 0) > MAX_BYTES) return;
    if (file.alt_txt && file.alt_txt.length > 0) return; // already has alt text

    const downloadUrl = file.url_private_download || file.url_private;
    const channelId = /** @type {any} */ (event).channel_id || file.channels?.[0] || file.groups?.[0] || file.ims?.[0];
    if (!downloadUrl || !channelId) return;

    const botToken = context.botToken || process.env.SLACK_BOT_TOKEN;
    const res = await fetch(downloadUrl, { headers: { Authorization: `Bearer ${botToken}` } });
    if (!res.ok) {
      logger.warn(`alt-text: download failed (${res.status})`);
      return;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const altText = await describeImage(buffer, mimetype);
    if (!altText) return;

    // file_shared does not expose a thread context; post the alt text in the channel.
    await client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `:framed_picture: *Alt text* (auto-generated): ${altText}` }],
        },
      ],
      text: `Alt text: ${altText}`,
    });
  } catch (e) {
    logger.error(`Failed to generate alt text: ${e}`);
  }
}
