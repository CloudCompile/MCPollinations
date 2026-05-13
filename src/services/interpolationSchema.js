export const interpolateImagesSchema = {
  name: 'interpolateImages',
  description: 'Create intermediate frames between two images to morph/interpolate between them. Useful for animations. Returns array of intermediate image URLs.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl1: {
        type: 'string',
        description: 'Public HTTP(S) URL of the first image'
      },
      imageUrl2: {
        type: 'string',
        description: 'Public HTTP(S) URL of the second image'
      },
      steps: {
        type: 'number',
        description: 'Number of interpolation steps between the two images (default: 5, min: 2, max: 30)'
      },
      model: {
        type: 'string',
        description: 'Interpolation model in owner/name format (default: "riffusion/riffusion")'
      }
    },
    required: ['imageUrl1', 'imageUrl2']
  }
};
