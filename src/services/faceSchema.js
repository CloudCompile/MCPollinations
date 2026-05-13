export const swapFacesSchema = {
  name: 'swapFaces',
  description: 'Swap faces between two images using face-swapping AI models. Returns base64-encoded result image and media URL.',
  inputSchema: {
    type: 'object',
    properties: {
      sourceImageUrl: {
        type: 'string',
        description: 'Public HTTP(S) URL of the image containing the source face'
      },
      targetImageUrl: {
        type: 'string',
        description: 'Public HTTP(S) URL of the image containing the target (where to place the face)'
      },
      model: {
        type: 'string',
        description: 'Face-swap model in owner/name format (default: "deepfaceswap/deepfaceswap")'
      }
    },
    required: ['sourceImageUrl', 'targetImageUrl']
  }
};

export const changeFaceExpressionSchema = {
  name: 'changeFaceExpression',
  description: 'Modify the facial expression in an image (e.g., smile, sad, surprised). Returns base64-encoded result image and media URL.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'Public HTTP(S) URL of the image containing a face'
      },
      expression: {
        type: 'string',
        description: 'Target expression: "smile", "sad", "surprised", "angry", "neutral", etc.'
      },
      model: {
        type: 'string',
        description: 'Expression-swap model in owner/name format (default: "sberbank-ai/face-expression-swap")'
      }
    },
    required: ['imageUrl', 'expression']
  }
};
