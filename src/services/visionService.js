const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

import { retryWithBackoff } from '../utils/retry.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';

const REPLICATE_BASE_URL = 'https://api.replicate.com/v1';

function createReplicateHeaders(replicateAuthConfig) {
  if (!replicateAuthConfig?.token) {
    throw new Error('Replicate API token is required. Set REPLICATE_API_TOKEN in MCP env.');
  }
  return {
    Authorization: `Bearer ${replicateAuthConfig.token}`,
    'Content-Type': 'application/json'
  };
}

async function pollPrediction(predictionId, replicateAuthConfig, timeoutMs = 120000) {
  const headers = { Authorization: `Bearer ${replicateAuthConfig.token}` };
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate polling failed (${response.status}): ${errorText || response.statusText}`);
    }

    const prediction = await response.json();
    log('Replicate vision prediction status:', prediction.status);

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Replicate prediction ${prediction.status}: ${prediction.error || 'unknown error'}`);
    }
  }

  throw new Error('Replicate prediction timed out after 120 seconds');
}

export async function analyzeImage(imageUrl, prompt, model = 'openai/clip-vit-base-patch32', replicateAuthConfig = null) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('imageUrl is required and must be a string');
  }
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt is required and must be a string');
  }

  await globalRateLimiter.check('analyzeImage');

  return retryWithBackoff(async () => {
    const payload = {
      input: {
        image: imageUrl,
        prompt: prompt
      }
    };

    const [owner, modelName] = model.split('/');
    if (!owner || !modelName) {
      throw new Error('model must be in owner/name format');
    }

    const response = await fetch(`${REPLICATE_BASE_URL}/models/${owner}/${modelName}/predictions`, {
      method: 'POST',
      headers: createReplicateHeaders(replicateAuthConfig),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate request failed (${response.status}): ${errorText || response.statusText}`);
    }

    const prediction = await response.json();
    const completed = await pollPrediction(prediction.id, replicateAuthConfig);

    const output = Array.isArray(completed.output) ? completed.output[0] : completed.output;
    if (!output) {
      throw new Error('Replicate returned no output');
    }

    return {
      text: output,
      model,
      imageUrl,
      prompt
    };
  });
}

export async function captionImage(imageUrl, model = 'salesforce/blip', replicateAuthConfig = null) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('imageUrl is required and must be a string');
  }

  await globalRateLimiter.check('captionImage');

  return retryWithBackoff(async () => {
    const payload = {
      input: {
        image: imageUrl
      }
    };

    const [owner, modelName] = model.split('/');
    if (!owner || !modelName) {
      throw new Error('model must be in owner/name format');
    }

    const response = await fetch(`${REPLICATE_BASE_URL}/models/${owner}/${modelName}/predictions`, {
      method: 'POST',
      headers: createReplicateHeaders(replicateAuthConfig),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate request failed (${response.status}): ${errorText || response.statusText}`);
    }

    const prediction = await response.json();
    const completed = await pollPrediction(prediction.id, replicateAuthConfig);

    const caption = Array.isArray(completed.output) ? completed.output[0] : completed.output;
    if (!caption) {
      throw new Error('Replicate returned no caption');
    }

    return {
      caption,
      model,
      imageUrl
    };
  });
}
