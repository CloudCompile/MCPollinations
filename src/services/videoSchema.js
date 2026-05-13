export const generateVideoSchema = {
  name: 'generateVideo',
  description: 'Generate a video from a text prompt using the Pollinations video generation API. Returns a shareable download link.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Text description of the video to generate'
      },
      model: {
        type: 'string',
        description: 'Video generation model (default: "wan")'
      },
      width: {
        type: 'number',
        description: 'Width of the generated video in pixels'
      },
      height: {
        type: 'number',
        description: 'Height of the generated video in pixels'
      },
      duration: {
        type: 'number',
        description: 'Duration of the video in seconds'
      },
      seed: {
        type: 'number',
        description: 'Seed for reproducible results (default: random)'
      },
      enhance: {
        type: 'boolean',
        description: 'Whether to enhance the prompt using an LLM before generating'
      },
      safe: {
        type: 'boolean',
        description: 'Whether to apply content filtering'
      }
    },
    required: ['prompt']
  }
};
