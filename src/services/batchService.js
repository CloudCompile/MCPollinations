const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

const POLLINATIONS_OPENAI_BASE_URL = process.env.POLLINATIONS_API_BASE_URL || 'https://gen.pollinations.ai/v1';

async function fetchImageAsBase64(imageUrl, authConfig) {
  const headers = {};
  if (authConfig?.token) headers.Authorization = `Bearer ${authConfig.token}`;
  if (authConfig?.referrer) headers.Referer = authConfig.referrer;

  const response = await fetch(imageUrl, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}): ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return {
    data: Buffer.from(arrayBuffer).toString('base64'),
    mimeType: response.headers.get('content-type') || 'image/png'
  };
}

async function generateSingleImageBase64(prompt, model, seed, width, height, enhance, safe, authConfig) {
  const headers = { 'Content-Type': 'application/json' };
  if (authConfig?.token) headers.Authorization = `Bearer ${authConfig.token}`;
  if (authConfig?.referrer) headers.Referer = authConfig.referrer;

  const payload = {
    model,
    prompt,
    size: `${width}x${height}`,
    seed,
    enhance,
    safe,
    response_format: 'url'
  };

  const response = await fetch(`${POLLINATIONS_OPENAI_BASE_URL}/images/generations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to generate image (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();
  const imageUrl = result?.data?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Image generation succeeded but no URL was returned');
  }

  const imageData = await fetchImageAsBase64(imageUrl, authConfig);
  return { ...imageData, seed, index: seed };
}

export async function generateImageBatch(prompt, count = 4, seeds = null, width = 1024, height = 1024, model = 'flux', enhance = true, safe = false, authConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt is required and must be a string');
  }

  const batchCount = Math.max(1, Math.min(8, Number(count) || 4));

  const resolvedSeeds = Array.isArray(seeds) && seeds.length >= batchCount
    ? seeds.slice(0, batchCount)
    : Array.from({ length: batchCount }, (_, i) =>
        (Array.isArray(seeds) && seeds[i] != null) ? seeds[i] : Math.floor(Math.random() * 1000000)
      );

  log(`Generating batch of ${batchCount} images for prompt: "${prompt}"`);

  const tasks = resolvedSeeds.map((seed, i) =>
    generateSingleImageBase64(prompt, model, seed, width, height, enhance, safe, authConfig)
      .then((result) => ({ status: 'fulfilled', value: { ...result, index: i } }))
      .catch((error) => ({ status: 'rejected', reason: error.message, index: i }))
  );

  const results = await Promise.all(tasks);

  return {
    prompt,
    count: batchCount,
    model,
    width,
    height,
    enhance,
    safe,
    results
  };
}
