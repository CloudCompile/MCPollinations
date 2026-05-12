/**
 * Pollinations Endpoint Service
 *
 * Generic coverage for additional Pollinations API endpoints.
 */

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

const POLLINATIONS_BASE_URL = process.env.POLLINATIONS_BASE_URL || 'https://gen.pollinations.ai';
const POLLINATIONS_V1_BASE_URL = `${POLLINATIONS_BASE_URL}/v1`;

function encodePathPart(value) {
  return encodeURIComponent(String(value));
}

function toQueryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)));
      return;
    }
    params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function createHeaders(authConfig, { requireAuth = true, json = false, extra = {} } = {}) {
  const headers = { ...extra };

  if (json) {
    headers['Content-Type'] = 'application/json';
  }

  if (authConfig?.token) {
    headers.Authorization = `Bearer ${authConfig.token}`;
  } else if (requireAuth) {
    throw new Error('Pollinations API token is required. Set token/POLLINATIONS_TOKEN in MCP env.');
  }

  if (authConfig?.referrer) {
    headers.Referer = authConfig.referrer;
  }

  return headers;
}

async function parseByType(response, responseType = 'json') {
  if (responseType === 'text') {
    return await response.text();
  }

  if (responseType === 'base64') {
    const arrayBuffer = await response.arrayBuffer();
    return {
      data: Buffer.from(arrayBuffer).toString('base64'),
      mimeType: response.headers.get('content-type') || 'application/octet-stream'
    };
  }

  return await response.json();
}

async function requestPollinations(url, { method = 'GET', headers = {}, body, responseType = 'json' } = {}) {
  const response = await fetch(url, { method, headers, body });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pollinations request failed (${response.status}): ${errorText || response.statusText}`);
  }

  return await parseByType(response, responseType);
}

export async function getSimpleText(prompt, query = {}, authConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt is required and must be a string');
  }

  const url = `${POLLINATIONS_BASE_URL}/text/${encodePathPart(prompt)}${toQueryString(query)}`;
  return await requestPollinations(url, {
    method: 'GET',
    headers: createHeaders(authConfig, { requireAuth: true }),
    responseType: 'text'
  });
}

export async function postSimpleText(prompt, model = 'openai', authConfig = null, messages = null) {
  if (messages !== null && messages !== undefined && !Array.isArray(messages)) {
    throw new Error('messages must be an array when provided');
  }

  if ((!messages || messages.length === 0) && (!prompt || typeof prompt !== 'string')) {
    throw new Error('Either a valid prompt string or a non-empty messages array is required');
  }

  const normalizedMessages = Array.isArray(messages) && messages.length > 0
    ? messages
    : [{ role: 'user', content: prompt }];

  const payload = { model, messages: normalizedMessages };
  return await requestPollinations(`${POLLINATIONS_BASE_URL}/text`, {
    method: 'POST',
    headers: createHeaders(authConfig, { requireAuth: true, json: true }),
    body: JSON.stringify(payload),
    responseType: 'text'
  });
}

export function getSimpleImageUrl(prompt, query = {}) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt is required and must be a string');
  }

  return `${POLLINATIONS_BASE_URL}/image/${encodePathPart(prompt)}${toQueryString(query)}`;
}

export function getSimpleVideoUrl(prompt, query = {}) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt is required and must be a string');
  }

  return `${POLLINATIONS_BASE_URL}/video/${encodePathPart(prompt)}${toQueryString(query)}`;
}

export function getSimpleAudioUrl(text, query = {}) {
  if (!text || typeof text !== 'string') {
    throw new Error('text is required and must be a string');
  }

  return `${POLLINATIONS_BASE_URL}/audio/${encodePathPart(text)}${toQueryString(query)}`;
}

export async function createSpeech(input, model = 'qwen-tts', voice = 'nova', authConfig = null) {
  if (!input || typeof input !== 'string') {
    throw new Error('input is required and must be a string');
  }

  const payload = {
    model,
    input,
    voice,
    response_format: 'mp3'
  };

  return await requestPollinations(`${POLLINATIONS_V1_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: createHeaders(authConfig, { requireAuth: true, json: true }),
    body: JSON.stringify(payload),
    responseType: 'base64'
  });
}

export async function transcribeAudioFromUrl(audioUrl, model = 'whisper', authConfig = null) {
  if (!audioUrl || typeof audioUrl !== 'string') {
    throw new Error('audioUrl is required and must be a string');
  }

  const sourceResponse = await fetch(audioUrl);
  if (!sourceResponse.ok) {
    throw new Error(`Failed to fetch source audio (${sourceResponse.status}) from ${audioUrl}: ${sourceResponse.statusText}`);
  }

  const contentType = sourceResponse.headers.get('content-type') || 'audio/mpeg';
  const audioBuffer = Buffer.from(await sourceResponse.arrayBuffer());

  const formData = new FormData();
  formData.append('model', model);
  formData.append('file', new Blob([audioBuffer], { type: contentType }), 'audio-input');

  return await requestPollinations(`${POLLINATIONS_V1_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: createHeaders(authConfig, { requireAuth: true }),
    body: formData,
    responseType: 'json'
  });
}

export async function createEmbeddings(input, model = 'openai-3-small', dimensions, authConfig = null) {
  if (!input || (typeof input !== 'string' && !Array.isArray(input))) {
    throw new Error('input is required and must be a string or array of strings');
  }

  const payload = { model, input };
  if (dimensions !== undefined) {
    payload.dimensions = dimensions;
  }

  return await requestPollinations(`${POLLINATIONS_V1_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: createHeaders(authConfig, { requireAuth: true, json: true }),
    body: JSON.stringify(payload),
    responseType: 'json'
  });
}

export async function listModels(endpoint = 'v1', authConfig = null) {
  const endpointMap = {
    v1: `${POLLINATIONS_V1_BASE_URL}/models`,
    models: `${POLLINATIONS_BASE_URL}/models`,
    text: `${POLLINATIONS_BASE_URL}/text/models`,
    image: `${POLLINATIONS_BASE_URL}/image/models`,
    audio: `${POLLINATIONS_BASE_URL}/audio/models`,
    embeddings: `${POLLINATIONS_BASE_URL}/embeddings/models`
  };

  const url = endpointMap[endpoint];
  if (!url) {
    throw new Error('Invalid model endpoint. Use one of: v1, models, text, image, audio, embeddings');
  }

  return await requestPollinations(url, {
    method: 'GET',
    headers: createHeaders(authConfig, { requireAuth: false }),
    responseType: 'json'
  });
}

export async function getAccountData(endpoint = 'profile', query = {}, authConfig = null) {
  const endpointMap = {
    profile: '/account/profile',
    balance: '/account/balance',
    usage: '/account/usage',
    usageDaily: '/account/usage/daily',
    earnings: '/account/earnings',
    keys: '/account/keys',
    key: '/account/key',
    keyUsage: '/account/key/usage'
  };

  const path = endpointMap[endpoint];
  if (!path) {
    throw new Error('Invalid account endpoint. Use one of: profile, balance, usage, usageDaily, earnings, keys, key, keyUsage');
  }

  const url = `${POLLINATIONS_BASE_URL}${path}${toQueryString(query)}`;
  return await requestPollinations(url, {
    method: 'GET',
    headers: createHeaders(authConfig, { requireAuth: true }),
    responseType: 'json'
  });
}

export async function createAccountKey(payload, authConfig = null) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('payload is required and must be an object');
  }

  return await requestPollinations(`${POLLINATIONS_BASE_URL}/account/keys`, {
    method: 'POST',
    headers: createHeaders(authConfig, { requireAuth: true, json: true }),
    body: JSON.stringify(payload),
    responseType: 'json'
  });
}

export async function deleteAccountKey(id, authConfig = null) {
  if (!id || typeof id !== 'string') {
    throw new Error('id is required and must be a string');
  }

  return await requestPollinations(`${POLLINATIONS_BASE_URL}/account/keys/${encodePathPart(id)}`, {
    method: 'DELETE',
    headers: createHeaders(authConfig, { requireAuth: true }),
    responseType: 'json'
  });
}

export async function openAiCompatiblePost(path, payload = {}, authConfig = null) {
  if (!path || typeof path !== 'string') {
    throw new Error('path is required and must be a string');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${POLLINATIONS_BASE_URL}${normalizedPath}`;

  return await requestPollinations(url, {
    method: 'POST',
    headers: createHeaders(authConfig, { requireAuth: true, json: true }),
    body: JSON.stringify(payload),
    responseType: 'json'
  });
}

export async function openAiCompatibleGet(path, query = {}, authConfig = null) {
  if (!path || typeof path !== 'string') {
    throw new Error('path is required and must be a string');
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${POLLINATIONS_BASE_URL}${normalizedPath}${toQueryString(query)}`;

  return await requestPollinations(url, {
    method: 'GET',
    headers: createHeaders(authConfig, { requireAuth: false }),
    responseType: 'json'
  });
}
