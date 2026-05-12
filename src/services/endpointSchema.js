/**
 * Schema definitions for expanded Pollinations endpoints.
 */

export const getSimpleTextSchema = {
  name: 'getSimpleText',
  description: 'GET /text/{prompt} - generate plain text from a prompt',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Text prompt for /text/{prompt}' },
      query: { type: 'object', description: 'Optional query params (e.g. model, safe)' }
    },
    required: ['prompt']
  }
};

export const postSimpleTextSchema = {
  name: 'postSimpleText',
  description: 'POST /text - generate plain text with JSON payload (prompt or messages)',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Text prompt (used when messages is not provided)' },
      messages: {
        type: 'array',
        description: 'Chat messages array for /text payload',
        items: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['system', 'user', 'assistant'] },
            content: { type: 'string' }
          },
          required: ['role', 'content']
        }
      },
      model: { type: 'string', description: 'Model ID', default: 'openai' }
    },
    anyOf: [
      { required: ['prompt'] },
      { required: ['messages'] }
    ]
  }
};

export const getSimpleImageUrlSchema = {
  name: 'getSimpleImageUrl',
  description: 'GET /image/{prompt} - returns a direct image URL',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Image prompt' },
      query: { type: 'object', description: 'Optional query params (e.g. model, width, height, seed, safe)' }
    },
    required: ['prompt']
  }
};

export const getSimpleVideoUrlSchema = {
  name: 'getSimpleVideoUrl',
  description: 'GET /video/{prompt} - returns a direct video URL',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'Video prompt' },
      query: { type: 'object', description: 'Optional query params (e.g. model, duration, seed, safe)' }
    },
    required: ['prompt']
  }
};

export const getSimpleAudioUrlSchema = {
  name: 'getSimpleAudioUrl',
  description: 'GET /audio/{text} - returns a direct audio URL',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Audio text or music prompt' },
      query: { type: 'object', description: 'Optional query params (e.g. model, voice, seed, safe)' }
    },
    required: ['text']
  }
};

export const createSpeechSchema = {
  name: 'createSpeech',
  description: 'POST /v1/audio/speech - OpenAI-compatible text-to-speech (returns base64 mp3)',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Text to synthesize' },
      model: { type: 'string', description: 'Audio model ID', default: 'qwen-tts' },
      voice: { type: 'string', description: 'Voice ID', default: 'nova' }
    },
    required: ['input']
  }
};

export const transcribeAudioFromUrlSchema = {
  name: 'transcribeAudioFromUrl',
  description: 'POST /v1/audio/transcriptions - transcribe audio from a public URL',
  inputSchema: {
    type: 'object',
    properties: {
      audioUrl: { type: 'string', description: 'Public URL of audio file to transcribe' },
      model: { type: 'string', description: 'Transcription model ID', default: 'whisper' }
    },
    required: ['audioUrl']
  }
};

export const createEmbeddingsSchema = {
  name: 'createEmbeddings',
  description: 'POST /v1/embeddings - OpenAI-compatible embeddings',
  inputSchema: {
    type: 'object',
    properties: {
      input: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } }
        ],
        description: 'Embedding input text or batch'
      },
      model: { type: 'string', description: 'Embedding model ID', default: 'openai-3-small' },
      dimensions: { type: 'number', description: 'Optional output dimensions' }
    },
    required: ['input']
  }
};

export const listModelsSchema = {
  name: 'listModels',
  description: 'List Pollinations models from one of: /v1/models, /models, /text/models, /image/models, /audio/models, /embeddings/models',
  inputSchema: {
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
        enum: ['v1', 'models', 'text', 'image', 'audio', 'embeddings'],
        description: 'Model listing endpoint selector',
        default: 'v1'
      }
    }
  }
};

export const getAccountDataSchema = {
  name: 'getAccountData',
  description: 'GET account endpoints: profile, balance, usage, usageDaily, earnings, keys, key, keyUsage',
  inputSchema: {
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
        enum: ['profile', 'balance', 'usage', 'usageDaily', 'earnings', 'keys', 'key', 'keyUsage'],
        description: 'Account endpoint selector',
        default: 'profile'
      },
      query: {
        type: 'object',
        description: 'Optional query params (format, limit, before, days, granularity, period, api_key_ids, etc.)'
      }
    }
  }
};

export const createAccountKeySchema = {
  name: 'createAccountKey',
  description: 'POST /account/keys - create secret or publishable key',
  inputSchema: {
    type: 'object',
    properties: {
      payload: { type: 'object', description: 'Request body for /account/keys' }
    },
    required: ['payload']
  }
};

export const deleteAccountKeySchema = {
  name: 'deleteAccountKey',
  description: 'DELETE /account/keys/{id} - revoke API key',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Key ID to revoke' }
    },
    required: ['id']
  }
};

export const openAiCompatibleGetSchema = {
  name: 'openAiCompatibleGet',
  description: 'Generic GET helper for Pollinations endpoints (advanced use)',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Endpoint path, e.g. /models or /account/profile' },
      query: { type: 'object', description: 'Query params object' }
    },
    required: ['path']
  }
};

export const openAiCompatiblePostSchema = {
  name: 'openAiCompatiblePost',
  description: 'Generic POST helper for Pollinations endpoints (advanced use)',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Endpoint path, e.g. /v1/images/edits' },
      payload: { type: 'object', description: 'JSON payload for POST request' }
    },
    required: ['path']
  }
};
