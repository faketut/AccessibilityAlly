import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

const ALT_TEXT_PROMPT = `Describe this image as alt text for a screen reader user. \
One concise sentence (max 25 words). Plain language. No emoji. Do not start with "Image of" or "Picture of". \
If the image contains readable text (a screenshot, diagram, chart), include the key text and what it conveys.`;

/**
 * Generate alt text for an image using Gemini's multimodal API.
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
export async function describeImage(imageBuffer, mimeType) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: ALT_TEXT_PROMPT }, { inlineData: { mimeType, data: imageBuffer.toString('base64') } }],
      },
    ],
  });
  return (response.text ?? '').trim();
}
