const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

const POLLINATIONS_BASE_URL = process.env.POLLINATIONS_BASE_URL || 'https://gen.pollinations.ai';

function encodePathPart(value) {
  return encodeURIComponent(String(value));
}

export async function generateVideo(prompt, model = 'wan', width, height, duration, seed, enhance, safe, authConfig = null) {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error('prompt is required and must be a string');
  }

  const query = {};
  if (model) query.model = model;
  if (width != null) query.width = width;
  if (height != null) query.height = height;
  if (duration != null) query.duration = duration;
  if (seed != null) query.seed = seed;
  if (enhance != null) query.enhance = enhance;
  if (safe != null) query.safe = safe;
  query.nologo = true;
  query.private = true;

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const qs = params.toString();
  const videoUrl = `${POLLINATIONS_BASE_URL}/video/${encodePathPart(prompt)}${qs ? '?' + qs : ''}`;

  log('Fetching video from:', videoUrl);

  try {
    const headers = {};
    if (authConfig?.token) headers.Authorization = `Bearer ${authConfig.token}`;
    if (authConfig?.referrer) headers.Referer = authConfig.referrer;

    const response = await fetch(videoUrl, { headers });
    if (!response.ok) {
      throw new Error(`Failed to generate video (${response.status}): ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'video/mp4';

    return { data: base64, mimeType, prompt, model, width, height, duration, seed };
  } catch (error) {
    log('Error generating video:', error);
    throw error;
  }
}
