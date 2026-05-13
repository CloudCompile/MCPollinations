const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

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
    log('Replicate prediction status:', prediction.status);

    if (prediction.status === 'succeeded') {
      return prediction;
    }

    if (prediction.status === 'failed' || prediction.status === 'canceled') {
      throw new Error(`Replicate prediction ${prediction.status}: ${prediction.error || 'unknown error'}`);
    }
  }

  throw new Error('Replicate prediction timed out after 120 seconds');
}

export async function upscaleImage(imageUrl, scale = 4, model = 'nightmareai/real-esrgan', replicateAuthConfig = null) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('imageUrl is required and must be a string');
  }

  const [owner, modelName] = model.split('/');
  if (!owner || !modelName) {
    throw new Error('model must be in owner/name format');
  }

  const payload = {
    input: {
      image: imageUrl,
      scale: Number(scale)
    }
  };

  try {
    const response = await fetch(`${REPLICATE_BASE_URL}/models/${owner}/${modelName}/predictions`, {
      method: 'POST',
      headers: createReplicateHeaders(replicateAuthConfig),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate upscale request failed (${response.status}): ${errorText || response.statusText}`);
    }

    const prediction = await response.json();
    const completed = await pollPrediction(prediction.id, replicateAuthConfig);

    const outputUrl = Array.isArray(completed.output) ? completed.output[0] : completed.output;
    if (!outputUrl) {
      throw new Error('Replicate returned no output URL');
    }

    const imgResponse = await fetch(outputUrl);
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch upscaled image (${imgResponse.status}): ${imgResponse.statusText}`);
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imgResponse.headers.get('content-type') || 'image/png';

    return { data: base64, mimeType, outputUrl, model, scale };
  } catch (error) {
    log('Error upscaling image:', error);
    throw error;
  }
}

export async function generateMusic(prompt, duration = 8, modelVersion = 'stereo-large', replicateAuthConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt is required and must be a string');
  }

  const payload = {
    input: {
      prompt,
      duration: Math.max(5, Math.min(30, Number(duration) || 8)),
      model_version: modelVersion
    }
  };

  try {
    const response = await fetch(`${REPLICATE_BASE_URL}/models/meta/musicgen/predictions`, {
      method: 'POST',
      headers: createReplicateHeaders(replicateAuthConfig),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Replicate music generation failed (${response.status}): ${errorText || response.statusText}`);
    }

    const prediction = await response.json();
    const completed = await pollPrediction(prediction.id, replicateAuthConfig);

    const outputUrl = Array.isArray(completed.output) ? completed.output[0] : completed.output;
    if (!outputUrl) {
      throw new Error('Replicate returned no output URL');
    }

    const audioResponse = await fetch(outputUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch generated audio (${audioResponse.status}): ${audioResponse.statusText}`);
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = audioResponse.headers.get('content-type') || 'audio/wav';

    return { data: base64, mimeType, outputUrl, prompt, duration, modelVersion };
  } catch (error) {
    log('Error generating music:', error);
    throw error;
  }
}
