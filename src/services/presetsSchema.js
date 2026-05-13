export const savePresetSchema = {
  name: 'savePreset',
  description: 'Save a named preset of image generation parameters (model, enhance, safe, etc.) for reuse. Presets are stored in-memory for the session.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the preset (e.g., "anime", "photorealistic", "sketch")'
      },
      params: {
        type: 'object',
        description: 'Parameter object with properties like model, enhance, safe, width, height, etc.'
      }
    },
    required: ['name', 'params']
  }
};

export const loadPresetSchema = {
  name: 'loadPreset',
  description: 'Load a saved preset by name and return its parameters. Can load both user-saved and default presets.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the preset to load'
      }
    },
    required: ['name']
  }
};

export const listPresetsSchema = {
  name: 'listPresets',
  description: 'List all available presets (both default and user-created). Returns default presets, user presets, and combined list.',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};
