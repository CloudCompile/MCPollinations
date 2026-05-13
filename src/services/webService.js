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

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]) : '';
}

export async function webSearch(query, maxResults = 10) {
  if (!query || typeof query !== 'string') {
    throw new Error('query is required and must be a string');
  }

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MCPollinations/1.0' }
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const results = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText,
        url: data.AbstractURL || ''
      });
    }

    for (const topic of (data.RelatedTopics || [])) {
      if (results.length >= maxResults) break;

      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.split(' - ')[0] || topic.Text,
          snippet: topic.Text,
          url: topic.FirstURL
        });
      } else if (topic.Topics) {
        for (const sub of topic.Topics) {
          if (results.length >= maxResults) break;
          if (sub.Text && sub.FirstURL) {
            results.push({
              title: sub.Text.split(' - ')[0] || sub.Text,
              snippet: sub.Text,
              url: sub.FirstURL
            });
          }
        }
      }
    }

    return { query, results: results.slice(0, maxResults), source: 'DuckDuckGo' };
  } catch (error) {
    log('Error performing web search:', error);
    throw error;
  }
}

export async function webFetch(url) {
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
      const title = extractTitle(rawText);
      const text = stripHtml(rawText);
      return { url, title, text, contentType };
    }

    return { url, title: '', text: rawText, contentType };
  } catch (error) {
    log('Error fetching URL:', error);
    throw error;
  }
}

export async function extractLinks(url) {
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

    const html = await response.text();
    const links = [];
    const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = anchorRegex.exec(html)) !== null) {
      const href = match[1];
      const text = stripHtml(match[2]).trim();
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        let resolvedUrl = href;
        if (href.startsWith('//')) {
          resolvedUrl = 'https:' + href;
        } else if (href.startsWith('/')) {
          const base = new URL(url);
          resolvedUrl = `${base.protocol}//${base.host}${href}`;
        } else if (!href.startsWith('http')) {
          const base = new URL(url);
          resolvedUrl = `${base.protocol}//${base.host}/${href}`;
        }
        links.push({ text: text || href, url: resolvedUrl });
      }
    }

    return { url, links };
  } catch (error) {
    log('Error extracting links:', error);
    throw error;
  }
}
