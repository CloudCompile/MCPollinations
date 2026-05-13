export const extractTextFromUrlSchema = {
  name: 'extractTextFromUrl',
  description: 'Fetch a URL and extract clean plain text from its content. Supports HTML pages and plain text files.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL of the document or page to extract text from'
      }
    },
    required: ['url']
  }
};

export const compareImagesSchema = {
  name: 'compareImages',
  description: 'Fetch two images by URL and compute a byte-level similarity estimate between them. Returns a percentage score where ~100% means identical and ~0% means completely different.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl1: {
        type: 'string',
        description: 'URL of the first image'
      },
      imageUrl2: {
        type: 'string',
        description: 'URL of the second image'
      }
    },
    required: ['imageUrl1', 'imageUrl2']
  }
};
