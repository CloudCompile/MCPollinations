const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function extractTextFromUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('url is required and must be a string');
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MCPollinations/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status}): ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    if (contentType.includes('text/html')) {
      const titleMatch = rawText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? stripHtml(titleMatch[1]) : '';
      const text = stripHtml(rawText);
      return { url, title, text, contentType };
    }

    return { url, title: '', text: rawText.trim(), contentType };
  } catch (error) {
    log('Error extracting text from URL:', error);
    throw error;
  }
}

function sampleBytes(buffer, sampleCount = 256) {
  const bytes = new Uint8Array(buffer);
  const step = Math.max(1, Math.floor(bytes.length / sampleCount));
  const samples = [];
  for (let i = 0; i < bytes.length && samples.length < sampleCount; i += step) {
    samples.push(bytes[i]);
  }
  return samples;
}

function computeSimilarity(samplesA, samplesB) {
  const len = Math.min(samplesA.length, samplesB.length);
  if (len === 0) return 0;

  let sumSq = 0;
  for (let i = 0; i < len; i++) {
    const diff = samplesA[i] - samplesB[i];
    sumSq += diff * diff;
  }

  const rmse = Math.sqrt(sumSq / len);
  const similarity = Math.max(0, 1 - rmse / 255);
  return Math.round(similarity * 100);
}

export async function compareImages(imageUrl1, imageUrl2) {
  if (!imageUrl1 || typeof imageUrl1 !== 'string') {
    throw new Error('imageUrl1 is required and must be a string');
  }
  if (!imageUrl2 || typeof imageUrl2 !== 'string') {
    throw new Error('imageUrl2 is required and must be a string');
  }

  try {
    const [response1, response2] = await Promise.all([
      fetch(imageUrl1, { headers: { 'User-Agent': 'MCPollinations/1.0' } }),
      fetch(imageUrl2, { headers: { 'User-Agent': 'MCPollinations/1.0' } })
    ]);

    if (!response1.ok) {
      throw new Error(`Failed to fetch imageUrl1 (${response1.status}): ${response1.statusText}`);
    }
    if (!response2.ok) {
      throw new Error(`Failed to fetch imageUrl2 (${response2.status}): ${response2.statusText}`);
    }

    const [buffer1, buffer2] = await Promise.all([
      response1.arrayBuffer(),
      response2.arrayBuffer()
    ]);

    const mimeType1 = response1.headers.get('content-type') || 'image/unknown';
    const mimeType2 = response2.headers.get('content-type') || 'image/unknown';

    const samples1 = sampleBytes(buffer1);
    const samples2 = sampleBytes(buffer2);
    const similarityPercent = computeSimilarity(samples1, samples2);

    return {
      imageUrl1,
      imageUrl2,
      similarityPercent,
      mimeType1,
      mimeType2,
      size1: buffer1.byteLength,
      size2: buffer2.byteLength,
      note: 'Similarity is estimated via byte-level sampling — not a perceptual hash. Identical images score ~100%, completely different images score ~0%.'
    };
  } catch (error) {
    log('Error comparing images:', error);
    throw error;
  }
}
