export const generateMusicSchema = {
  name: 'generateMusic',
  description:
    'Generate music from a text prompt using the Pollinations audio endpoint with music-capable models (e.g. musicgen).',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Text description of the music to generate'
      },
      duration: {
        type: 'number',
        description: 'Approximate duration in seconds (default: 30)'
      },
      model: {
        type: 'string',
        description: "Music model to use (default: 'musicgen')"
      }
    },
    required: ['prompt']
  }
};
