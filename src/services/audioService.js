/**
 * Pollinations Audio Service
 *
 * Functions for interacting with the Pollinations Audio API
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

/**
 * Generates an audio response to a text prompt using the Pollinations OpenAI-compatible API
 *
 * @param {string} prompt - The text prompt to respond to with audio
 * @param {string} [voice="alloy"] - Voice to use for audio generation
 * @param {number} [seed] - Seed for reproducible results
 * @param {string} [voiceInstructions] - Additional instructions for voice character/style
 * @param {Object} [authConfig] - Authentication configuration {token, referrer}
 * @returns {Promise<Object>} - Object containing the base64 audio data, mime type, and metadata
 */
export async function respondAudio(prompt, voice = "alloy", seed, voiceInstructions, authConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Prompt is required and must be a string');
  }

  const finalPrompt = voiceInstructions
    ? `${voiceInstructions}\n\n${prompt}`
    : prompt;

  const payload = {
    model: 'openai-audio',
    modalities: ['text', 'audio'],
    audio: {
      voice,
      format: 'mp3'
    },
    messages: [
      {
        role: 'user',
        content: finalPrompt
      }
    ],
    stream: false
  };

  if (seed !== undefined) {
    payload.seed = seed;
  }

  try {
    const response = await fetch(`${POLLINATIONS_OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: createAuthHeaders(authConfig, true),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate audio (${response.status}): ${errorText || response.statusText}`);
    }

    const result = await response.json();
    const audioData = result?.choices?.[0]?.message?.audio?.data;

    if (!audioData) {
      throw new Error('Audio generation succeeded but no audio data was returned by Pollinations.');
    }

    return {
      data: audioData,
      mimeType: 'audio/mpeg',
      metadata: {
        prompt,
        voice,
        model: 'openai-audio',
        seed,
        voiceInstructions
      }
    };
  } catch (error) {
    log('Error generating audio:', error);
    throw error;
  }
}

/**
 * List available audio voices
 *
 * @returns {Promise<Object>} - Object containing the list of available voice options
 */
export async function listAudioVoices() {
  const voices = [
    "alloy",
    "echo",
    "fable",
    "onyx",
    "nova",
    "shimmer",
    "coral",
    "verse",
    "ballad",
    "ash",
    "sage",
    "amuch",
    "dan"
  ];

  return { voices };
}
