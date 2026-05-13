export const upscaleImageSchema = {
  name: 'upscaleImage',
  description: 'Upscale an image using Real-ESRGAN via Replicate. Enhances image resolution by 2x or 4x. Requires REPLICATE_API_TOKEN in MCP env.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'URL of the image to upscale'
      },
      scale: {
        type: 'number',
        description: 'Upscaling factor — 2 or 4 (default: 4)'
      },
      model: {
        type: 'string',
        description: 'Replicate model in owner/name format (default: "nightmareai/real-esrgan")'
      }
    },
    required: ['imageUrl']
  }
};

export const generateMusicSchema = {
  name: 'generateMusic',
  description: 'Generate music from a text prompt using MusicGen via Replicate. Requires REPLICATE_API_TOKEN in MCP env.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Text description of the music to generate'
      },
      duration: {
        type: 'number',
        description: 'Duration in seconds (5–30, default: 8)'
      },
      modelVersion: {
        type: 'string',
        description: 'MusicGen model version (default: "stereo-large"). Options: "stereo-large", "stereo-medium", "melody-large", "large"'
      }
    },
    required: ['prompt']
  }
};
