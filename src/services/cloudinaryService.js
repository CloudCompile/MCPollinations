/**
 * Cloudinary Image Upscaling Service
 *
 * Upscales images using Cloudinary's AI upscale transformation (e_upscale).
 */

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

/**
 * Upload an image to Cloudinary and return the upscaled version.
 *
 * @param {string} imageUrl - URL of the image to upscale
 * @param {string} [scale='2x'] - Upscale factor: '2x' or '4x'
 * @param {Object} authConfig - { apiKey, apiSecret, cloudName }
 * @returns {Promise<Object>} - { data: base64, mimeType, url, scale }
 */
export async function upscaleImage(imageUrl, scale = '2x', authConfig) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('imageUrl is required and must be a string');
  }

  if (!authConfig?.cloudName || !authConfig?.apiKey || !authConfig?.apiSecret) {
    throw new Error(
      'Cloudinary credentials are required. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in MCP env.'
    );
  }

  const { cloudName, apiKey, apiSecret } = authConfig;

  // Fetch source image as base64 data URI
  log('Fetching source image for upscaling:', imageUrl);
  const srcResponse = await fetch(imageUrl);
  if (!srcResponse.ok) {
    throw new Error(`Failed to fetch source image (${srcResponse.status}): ${srcResponse.statusText}`);
  }
  const srcBuffer = await srcResponse.arrayBuffer();
  const srcBase64 = Buffer.from(srcBuffer).toString('base64');
  const srcMimeType = srcResponse.headers.get('content-type') || 'image/png';
  const dataUri = `data:${srcMimeType};base64,${srcBase64}`;

  // Upload to Cloudinary with authenticated request
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const uploadParams = { timestamp };

  // Build signature string (sorted alphabetical param=value pairs joined by &, then append secret)
  const signatureStr =
    Object.entries(uploadParams)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&') + apiSecret;

  // Generate SHA-1 signature
  const encoder = new TextEncoder();
  const data = encoder.encode(signatureStr);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('timestamp', timestamp);
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  log('Uploading image to Cloudinary...');
  const uploadResponse = await fetch(uploadUrl, { method: 'POST', body: formData });

  if (!uploadResponse.ok) {
    const errText = await uploadResponse.text();
    throw new Error(`Cloudinary upload failed (${uploadResponse.status}): ${errText}`);
  }

  const uploadResult = await uploadResponse.json();
  const publicId = uploadResult.public_id;
  log('Uploaded to Cloudinary, public_id:', publicId);

  // Build upscale transformation URL
  // e_upscale works for 2x; for 4x we apply e_upscale twice via chaining
  let transformation;
  if (scale === '4x') {
    transformation = 'e_upscale/e_upscale';
  } else {
    transformation = 'e_upscale';
  }

  const upscaledUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
  log('Fetching upscaled image from:', upscaledUrl);

  const upscaledResponse = await fetch(upscaledUrl);
  if (!upscaledResponse.ok) {
    throw new Error(`Failed to fetch upscaled image (${upscaledResponse.status}): ${upscaledResponse.statusText}`);
  }

  const upscaledBuffer = await upscaledResponse.arrayBuffer();
  const upscaledBase64 = Buffer.from(upscaledBuffer).toString('base64');
  const upscaledMimeType = upscaledResponse.headers.get('content-type') || 'image/png';

  return {
    data: upscaledBase64,
    mimeType: upscaledMimeType,
    url: upscaledUrl,
    scale,
    publicId
  };
}
