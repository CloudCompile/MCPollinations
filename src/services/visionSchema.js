export const analyzeImageSchema = {
  name: 'analyzeImage',
  description: 'Analyze an image by asking questions about it or requesting a description using vision models. Returns text analysis/answer.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'Public HTTP(S) URL of the image to analyze'
      },
      prompt: {
        type: 'string',
        description: 'Text description or question about the image (e.g., "What objects are in this image?", "Describe the scene")'
      },
      model: {
        type: 'string',
        description: 'Vision model ID in owner/name format (default: "openai/clip-vit-base-patch32")'
      }
    },
    required: ['imageUrl', 'prompt']
  }
};

export const captionImageSchema = {
  name: 'captionImage',
  description: 'Generate a caption/description for an image using BLIP or similar vision models. Returns a text caption.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'Public HTTP(S) URL of the image to caption'
      },
      model: {
        type: 'string',
        description: 'Vision model ID in owner/name format (default: "salesforce/blip")'
      }
    },
    required: ['imageUrl']
  }
};
