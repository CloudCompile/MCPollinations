/**
 * VoidAI Service
 *
 * OpenAI-compatible text and image generation via VoidAI (https://api.voidai.app/v1)
 * Supports GPT, Claude, Gemini, DeepSeek, and more through a single API key.
 */

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

const VOIDAI_BASE_URL = 'https://api.voidai.app/v1';

function createVoidHeaders(voidAuthConfig, includeJsonContentType = false) {
  if (!voidAuthConfig?.apiKey) {
    throw new Error('VoidAI API key is required. Set VOIDAI_API_KEY in MCP env.');
  }

  const headers = {
    Authorization: `Bearer ${voidAuthConfig.apiKey}`
  };

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

function extractTextFromCompletion(result) {
  const content = result?.choices?.[0]?.message?.content;

  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === 'string' ? item.text : ''))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof result?.output_text === 'string') return result.output_text;

  return JSON.stringify(result, null, 2);
}

/**
 * Generate a text response via VoidAI's OpenAI-compatible chat completions endpoint.
 *
 * @param {string} prompt - User message
 * @param {string} [model='gpt-4o-mini'] - Model name
 * @param {number} [seed] - Reproducibility seed
 * @param {number} [temperature] - Sampling temperature (0.0 – 2.0)
 * @param {number} [top_p] - Nucleus sampling probability (0.0 – 1.0)
 * @param {string} [system] - Optional system prompt
 * @param {Object} [voidAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<string>} - Generated text
 */
export async function respondVoid(prompt, model = 'gpt-4o-mini', seed = Math.floor(Math.random() * 1000000), temperature = null, top_p = null, system = null, voidAuthConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const payload = { model, messages, seed, stream: false };
  if (temperature !== null && temperature !== undefined) payload.temperature = temperature;
  if (top_p !== null && top_p !== undefined) payload.top_p = top_p;

  try {
    const response = await fetch(`${VOIDAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: createVoidHeaders(voidAuthConfig, true),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VoidAI request failed (${response.status}): ${errorText || response.statusText}`);
    }

    const result = await response.json();
    return extractTextFromCompletion(result);
  } catch (error) {
    log('Error calling VoidAI:', error);
    throw error;
  }
}

/**
 * Generate an image via VoidAI's OpenAI-compatible images endpoint.
 *
 * Free-tier models: gpt-image-1 (12,000 cr), gpt-image-1.5 (8,000 cr), gpt-image-2 (10,000 cr)
 *
 * @param {string} prompt - Image description
 * @param {string} [model='gpt-image-1'] - Image model to use
 * @param {string} [size='1024x1024'] - Image dimensions
 * @param {string} [quality='standard'] - Quality hint ('standard' | 'hd')
 * @param {number} [n=1] - Number of images to generate (1–4)
 * @param {Object} [voidAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<Object>} - { urls: string[], model, prompt, size }
 */
export async function generateVoidImage(prompt, model = 'gpt-image-1', size = '1024x1024', quality = 'standard', n = 1, voidAuthConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  const payload = {
    model,
    prompt,
    n: Math.max(1, Math.min(4, Number(n) || 1)),
    size,
    quality,
    response_format: 'url'
  };

  try {
    const response = await fetch(`${VOIDAI_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: createVoidHeaders(voidAuthConfig, true),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`VoidAI image generation failed (${response.status}): ${errorText || response.statusText}`);
    }

    const result = await response.json();
    const urls = (result?.data ?? []).map((item) => item.url).filter(Boolean);

    return { urls, model, prompt, size, quality };
  } catch (error) {
    log('Error generating VoidAI image:', error);
    throw error;
  }
}

/**
 * List free-tier models available on VoidAI.
 * Only returns models whose plan_requirements array includes "free".
 *
 * @param {Object} [voidAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<Object>} - { object: "list", data: [...] } (free models only)
 */
export async function listVoidModels(voidAuthConfig = null) {
  try {
    const response = await fetch(`${VOIDAI_BASE_URL}/models`, {
      headers: createVoidHeaders(voidAuthConfig)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list VoidAI models (${response.status}): ${errorText || response.statusText}`);
    }

    const result = await response.json();
    const freeModels = (result?.data ?? []).filter(
      (m) => Array.isArray(m.plan_requirements) && m.plan_requirements.includes('free')
    );

    const seen = new Set();
    const unique = freeModels.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });

    return { object: 'list', data: unique };
  } catch (error) {
    log('Error listing VoidAI models:', error);
    throw error;
  }
}
