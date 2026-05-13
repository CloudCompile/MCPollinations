export const defaultPresets = {
  anime: {
    enhance: true,
    safe: false,
    model: 'flux'
  },
  photorealistic: {
    enhance: true,
    safe: false,
    model: 'flux-pro'
  },
  sketch: {
    enhance: true,
    safe: false,
    model: 'flux'
  },
  oil_painting: {
    enhance: true,
    safe: false,
    model: 'flux'
  },
  watercolor: {
    enhance: true,
    safe: false,
    model: 'flux'
  },
  digital_art: {
    enhance: true,
    safe: false,
    model: 'flux'
  },
  cinematic: {
    enhance: true,
    safe: false,
    model: 'flux-pro'
  },
  minimal: {
    enhance: true,
    safe: false,
    model: 'flux'
  }
};

let userPresets = {};

export function savePreset(name, params) {
  if (!name || typeof name !== 'string') {
    throw new Error('name is required and must be a string');
  }
  if (!params || typeof params !== 'object') {
    throw new Error('params is required and must be an object');
  }

  userPresets[name] = params;
  return { name, params, message: `Preset '${name}' saved` };
}

export function loadPreset(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('name is required and must be a string');
  }

  const preset = userPresets[name] || defaultPresets[name];
  if (!preset) {
    throw new Error(`Preset '${name}' not found`);
  }

  return preset;
}

export function listPresets() {
  const allPresets = {
    ...defaultPresets,
    ...userPresets
  };
  return {
    default: Object.keys(defaultPresets),
    user: Object.keys(userPresets),
    all: Object.keys(allPresets)
  };
}

export function mergePreset(name, overrides = {}) {
  const preset = loadPreset(name);
  return { ...preset, ...overrides };
}
