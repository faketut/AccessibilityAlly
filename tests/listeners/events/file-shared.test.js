import assert from 'node:assert';
import { beforeEach, describe, it, mock } from 'node:test';

// handleFileShared has guard clauses that return before calling describeImage.
// Tests below exercise those guards exhaustively (no Gemini call needed).
// The happy-path (describeImage called) is an integration concern — skipped here.

describe('handleFileShared guards', () => {
  /** @type {typeof import('../../../listeners/events/file-shared.js').handleFileShared} */
  let handleFileShared;

  beforeEach(async () => {
    mock.reset();
    const mod = await import(`../../../listeners/events/file-shared.js?t=${Date.now()}`);
    handleFileShared = mod.handleFileShared;
  });

  function makeArgs({
    mimetype = 'image/png',
    size = 1000,
    altTxt = '',
    downloadUrl = 'https://files.slack.com/img.png',
    channelId = 'C999',
    fileNull = false,
  } = {}) {
    const client = {
      files: {
        info: mock.fn(async () => ({
          file: fileNull
            ? null
            : { mimetype, size, alt_txt: altTxt, url_private_download: downloadUrl, channels: [channelId] },
        })),
      },
      chat: { postMessage: mock.fn(async () => ({})) },
    };
    const context = { botToken: 'xoxb-test' };
    const event = { file_id: 'F123', channel_id: channelId };
    const logger = { warn: mock.fn(), error: mock.fn() };
    return { client, context, event, logger };
  }

  it('skips when files.info returns null file', async () => {
    const args = makeArgs({ fileNull: true });
    await handleFileShared(/** @type {any} */ (args));
    assert.strictEqual(args.client.chat.postMessage.mock.callCount(), 0);
  });

  it('skips non-image mimetypes without posting', async () => {
    const args = makeArgs({ mimetype: 'application/pdf' });
    await handleFileShared(/** @type {any} */ (args));
    assert.strictEqual(args.client.chat.postMessage.mock.callCount(), 0);
  });

  it('skips video mimetypes', async () => {
    const args = makeArgs({ mimetype: 'video/mp4' });
    await handleFileShared(/** @type {any} */ (args));
    assert.strictEqual(args.client.chat.postMessage.mock.callCount(), 0);
  });

  it('skips files larger than 8 MB', async () => {
    const args = makeArgs({ size: 9 * 1024 * 1024 });
    await handleFileShared(/** @type {any} */ (args));
    assert.strictEqual(args.client.chat.postMessage.mock.callCount(), 0);
  });

  it('skips files that already have alt text', async () => {
    const args = makeArgs({ altTxt: 'already described' });
    await handleFileShared(/** @type {any} */ (args));
    assert.strictEqual(args.client.chat.postMessage.mock.callCount(), 0);
  });

  it('skips when download URL is missing', async () => {
    const args = makeArgs({ downloadUrl: '' });
    await handleFileShared(/** @type {any} */ (args));
    assert.strictEqual(args.client.chat.postMessage.mock.callCount(), 0);
  });

  it('catches exceptions from files.info and logs error without throwing', async () => {
    const args = makeArgs();
    args.client.files.info = mock.fn(async () => {
      throw new Error('API error');
    });
    await assert.doesNotReject(handleFileShared(/** @type {any} */ (args)));
    assert.strictEqual(args.logger.error.mock.callCount(), 1);
  });
});
