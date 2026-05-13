/**
 * Music Generation Service
 *
 * Generates music using the Pollinations audio endpoint with the elevenmusic model.
 */

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

const POLLINATIONS_BASE_URL = process.env.POLLINATIONS_BASE_URL || 'https://gen.pollinations.ai';

function createAuthHeaders(authConfig, includeJsonContentType = false) {
  if (!authConfig?.token) {
    throw new Error('Pollinations API token is required. Set token/POLLINATIONS_TOKEN in MCP env.');
  }

  const headers = {
    Authorization: `Bearer ${authConfig.token}`
  };

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (authConfig.referrer) {
    headers['Referer'] = authConfig.referrer;
  }

  return headers;
}

/**
 * Generate music from a text prompt using the Pollinations audio endpoint.
 * Uses the elevenmusic model which is optimized for music generation.
 *
 * @param {string} prompt - Text description of the music to generate
 * @param {number} [duration=30] - Approximate duration hint in seconds (passed as query param)
 * @param {string} [model='elevenmusic'] - Music model to use (elevenmusic is the music-capable model)
 * @param {Object} [authConfig] - Pollinations auth config { token, referrer }
 * @returns {Promise<Object>} - { data: base64, mimeType, url, prompt, model, duration }
 */
export async function generateMusic(prompt, duration = 30, model = 'elevenmusic', authConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt is required and must be a string');
  }

  const params = new URLSearchParams();
  params.set('model', model);
  if (duration) params.set('duration', String(duration));

  const encodedPrompt = encodeURIComponent(prompt);
  const url = `${POLLINATIONS_BASE_URL}/audio/${encodedPrompt}?${params.toString()}`;
  log('Generating music from URL:', url);

  try {
    const headers = {};
    if (authConfig?.token) headers.Authorization = `Bearer ${authConfig.token}`;
    if (authConfig?.referrer) headers.Referer = authConfig.referrer;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Music generation failed (${response.status}): ${errText || response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'audio/mpeg';

    return {
      data: base64,
      mimeType,
      url,
      prompt,
      model,
      duration
    };
  } catch (error) {
    log('Error generating music:', error);
    throw error;
  }
}
