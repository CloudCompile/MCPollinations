export const upscaleImageSchema = {
  name: 'upscaleImage',
  description:
    'Upscale an image using Cloudinary AI upscaling (e_upscale transformation). Enhances image resolution by 2x or 4x. Requires CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in MCP env.',
  inputSchema: {
    type: 'object',
    properties: {
      imageUrl: {
        type: 'string',
        description: 'URL of the image to upscale'
      },
      scale: {
        type: 'string',
        description: "Upscaling factor — '2x' or '4x' (default: '2x')",
        enum: ['2x', '4x']
      }
    },
    required: ['imageUrl']
  }
};
