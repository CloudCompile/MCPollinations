/**
 * Schema definitions for the VoidAI tools
 */

export const respondVoidSchema = {
  name: 'respondVoid',
  description: 'Generate a text response via VoidAI. Access free-tier models: GPT-4o-mini, GPT-4o, Gemini 2.0/2.5, DeepSeek V3/R1, and more through a single OpenAI-compatible endpoint. Set VOIDAI_API_KEY in MCP env.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The text prompt to generate a response for'
      },
      model: {
        type: 'string',
        description: 'Model to use (default: "gpt-4o-mini"). Free-tier examples: "gpt-4o-mini", "gpt-4o", "gemini-2.0-flash", "gemini-2.5-pro", "deepseek-v3", "deepseek-r1". Use listVoidModels to see all free models.'
      },
      seed: {
        type: 'number',
        description: 'Seed for reproducible results (default: random)'
      },
      temperature: {
        type: 'number',
        description: 'Controls randomness (0.0 to 2.0, default: model default)'
      },
      top_p: {
        type: 'number',
        description: 'Nucleus sampling probability (0.0 to 1.0, default: model default)'
      },
      system: {
        type: 'string',
        description: 'Optional system prompt to guide the model\'s behavior'
      }
    },
    required: ['prompt']
  }
};

export const generateVoidImageSchema = {
  name: 'generateVoidImage',
  description: 'Generate images via VoidAI using free-tier image models. Set VOIDAI_API_KEY in MCP env.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Image description / prompt'
      },
      model: {
        type: 'string',
        description: 'Image model to use (default: "gpt-image-1"). Free-tier models: "gpt-image-1" (12,000 credits), "gpt-image-1.5" (8,000 credits), "gpt-image-2" (10,000 credits)'
      },
      size: {
        type: 'string',
        description: 'Image dimensions (default: "1024x1024"). Common values: "512x512", "1024x1024", "1792x1024", "1024x1792"'
      },
      quality: {
        type: 'string',
        description: 'Quality hint (default: "standard"). Use "hd" for higher quality where supported.'
      },
      n: {
        type: 'number',
        description: 'Number of images to generate (default: 1, max: 4)'
      }
    },
    required: ['prompt']
  }
};

export const listVoidModelsSchema = {
  name: 'listVoidModels',
  description: 'List all free-tier models available through VoidAI (filtered to models accessible on the free plan)',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};
