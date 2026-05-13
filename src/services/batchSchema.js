export const generateImageBatchSchema = {
  name: 'generateImageBatch',
  description: 'Generate multiple images in parallel from a single prompt using Pollinations. Returns each image as a base64 content block with shareable links.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Text description of the images to generate'
      },
      count: {
        type: 'number',
        description: 'Number of images to generate (1–8, default: 4)'
      },
      seeds: {
        type: 'array',
        items: { type: 'number' },
        description: 'Optional array of seeds for each image. If fewer seeds than count are provided, the rest are random.'
      },
      width: {
        type: 'number',
        description: 'Width of each generated image (default: 1024)'
      },
      height: {
        type: 'number',
        description: 'Height of each generated image (default: 1024)'
      },
      model: {
        type: 'string',
        description: 'Model to use for generation (default: user config or "flux")'
      },
      enhance: {
        type: 'boolean',
        description: 'Whether to enhance prompts with an LLM before generating (default: true)'
      },
      safe: {
        type: 'boolean',
        description: 'Whether to apply content filtering (default: false)'
      }
    },
    required: ['prompt']
  }
};
