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

async function pollPrediction(predictionId, replicateAuthConfig, timeoutMs = 300000) {
  const headers = { Authorization: `Bearer ${replicateAuthConfig.token}` };
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const response = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, { headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate polling failed (${response.status}): ${errorText || response.statusText}`);
    }

    const prediction = await response.json();
    log('Replicate interpolation status:', prediction.status);

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Replicate prediction ${prediction.status}: ${prediction.error || 'unknown error'}`);
    }
  }

  throw new Error('Replicate prediction timed out after 300 seconds');
}

export async function interpolateImages(imageUrl1, imageUrl2, steps = 5, model = 'riffusion/riffusion', replicateAuthConfig = null) {
  if (!imageUrl1 || typeof imageUrl1 !== 'string') {
    throw new Error('imageUrl1 is required and must be a string');
  }
  if (!imageUrl2 || typeof imageUrl2 !== 'string') {
    throw new Error('imageUrl2 is required and must be a string');
  }

  const numSteps = Math.max(2, Math.min(Number(steps) || 5, 30));

  await globalRateLimiter.check('interpolateImages');

  return retryWithBackoff(async () => {
    const payload = {
      input: {
        image_1: imageUrl1,
        image_2: imageUrl2,
        steps: numSteps
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
    const completed = await pollPrediction(prediction.id, replicateAuthConfig, 300000);

    const output = completed.output;
    if (!output) {
      throw new Error('Replicate returned no output');
    }

    const intermediateImages = Array.isArray(output) ? output : [output];

    return {
      imageUrl1,
      imageUrl2,
      steps: numSteps,
      intermediateImages,
      model,
      count: intermediateImages.length
    };
  });
}
