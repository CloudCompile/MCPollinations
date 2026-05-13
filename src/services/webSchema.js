export const webSearchSchema = {
  name: 'webSearch',
  description: 'Search the web using DuckDuckGo. Returns relevant results including titles, snippets, and URLs. No API key required.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)'
      }
    },
    required: ['query']
  }
};

export const webFetchSchema = {
  name: 'webFetch',
  description: 'Fetch a URL and return its content as plain text. Strips HTML tags and returns readable text along with the page title.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to fetch'
      }
    },
    required: ['url']
  }
};

export const extractLinksSchema = {
  name: 'extractLinks',
  description: 'Fetch a URL and extract all hyperlinks found on the page, returning an array of {text, url} objects.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to extract links from'
      }
    },
    required: ['url']
  }
};
