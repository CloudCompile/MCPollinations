export const removeBackgroundSchema = {
  name: 'removeBackground',
  description: 'Remove the background from an image, leaving a transparent background. Uses Replicate rembg model. Returns base64-encoded image and media URL.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'Public HTTP(S) URL of the image to process'
      },
      model: {
        type: 'string',
        description: 'Background removal model in owner/name format (default: "cjwbw/rembg")'
      }
    },
    required: ['imageUrl']
  }
};
