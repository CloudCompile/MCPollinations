/**
 * Pollinations Text Service
 *
 * Functions for interacting with the Pollinations Text API
 */

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };
const POLLINATIONS_OPENAI_BASE_URL = process.env.POLLINATIONS_API_BASE_URL || 'https://gen.pollinations.ai/v1';

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

function extractTextFromChatCompletion(result) {
  const content = result?.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === 'string' ? item.text : ''))
      .filter(Boolean)
      .join('\n');
  }

  if (typeof result?.output_text === 'string') {
    return result.output_text;
  }

  return JSON.stringify(result, null, 2);
}

/**
 * Responds with text to a prompt using the Pollinations Chat Completions API
 *
 * @param {string} prompt - The text prompt to generate a response for
 * @param {string} [model="openai"] - Model to use for text generation. Use listTextModels to see all available models
 * @param {number} [seed] - Seed for reproducible results (default: random)
 * @param {number} [temperature] - Controls randomness in the output (0.0 to 2.0)
 * @param {number} [top_p] - Controls diversity via nucleus sampling (0.0 to 1.0)
 * @param {string} [system] - System prompt to guide the model's behavior
 * @param {Object} [authConfig] - Authentication configuration {token, referrer}
 * @returns {Promise<string>} - The generated text response
 */
export async function respondText(prompt, model = "openai", seed = Math.floor(Math.random() * 1000000), temperature = null, top_p = null, system = null, authConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: prompt });

  const payload = {
    model,
    messages,
    seed,
    stream: false
  };

  if (temperature !== null && temperature !== undefined) payload.temperature = temperature;
  if (top_p !== null && top_p !== undefined) payload.top_p = top_p;

  try {
    const response = await fetch(`${POLLINATIONS_OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: createAuthHeaders(authConfig, true),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate text (${response.status}): ${errorText || response.statusText}`);
    }

    const result = await response.json();
    return extractTextFromChatCompletion(result);
  } catch (error) {
    log('Error generating text:', error);
    throw error;
  }
}

/**
 * List available text generation models from Pollinations API
 *
 * @param {Object} [authConfig] - Authentication configuration {token, referrer}
 * @returns {Promise<Object>} - Object containing the list of available text models
 */
export async function listTextModels(authConfig = null) {
  try {
    const response = await fetch(`${POLLINATIONS_OPENAI_BASE_URL}/models`, {
      headers: createAuthHeaders(authConfig)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list text models (${response.status}): ${errorText || response.statusText}`);
    }

    const models = await response.json();
    return { models };
  } catch (error) {
    log('Error listing text models:', error);
    throw error;
  }
}
