/**
 * Schema definitions for the E2B Code Interpreter tools
 */

export const createSandboxSchema = {
  name: 'createSandbox',
  description: 'Create a new E2B code execution sandbox. Returns a sandboxId that must be passed to all subsequent E2B tool calls. The server is stateless — store the sandboxId on your side.',
  inputSchema: {
    type: 'object',
    properties: {
      template: {
        type: 'string',
        description: 'Sandbox template name (default: "base"). Use "base" for Python/general use.'
      },
      timeoutMs: {
        type: 'number',
        description: 'Sandbox idle timeout in milliseconds (default: 300000 = 5 minutes). Sandbox is paused after this duration of inactivity.'
      }
    },
    required: []
  }
};

export const runCodeSchema = {
  name: 'runCode',
  description: 'Execute code in an existing E2B sandbox. Pass the sandboxId returned by createSandbox.',
  inputSchema: {
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'Sandbox ID returned by createSandbox'
      },
      code: {
        type: 'string',
        description: 'Code to execute'
      },
      language: {
        type: 'string',
        description: 'Language kernel to use (default: "python"). Supported: python, javascript, typescript, r, java'
      }
    },
    required: ['sandboxId', 'code']
  }
};

export const installPackageSchema = {
  name: 'installPackage',
  description: 'Install packages in an existing E2B sandbox. Uses pip for Python and npm for JavaScript/TypeScript.',
  inputSchema: {
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'Sandbox ID returned by createSandbox'
      },
      packages: {
        description: 'Package name(s) to install. Can be a string (single or space-separated) or an array of strings.',
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } }
        ]
      },
      language: {
        type: 'string',
        description: 'Language context to determine the package manager (default: "python"). Use "javascript" or "nodejs" for npm.'
      }
    },
    required: ['sandboxId', 'packages']
  }
};

export const readFileSchema = {
  name: 'readFile',
  description: 'Read a file from an existing E2B sandbox filesystem.',
  inputSchema: {
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'Sandbox ID returned by createSandbox'
      },
      filePath: {
        type: 'string',
        description: 'Absolute path to the file inside the sandbox (e.g. "/home/user/output.txt")'
      }
    },
    required: ['sandboxId', 'filePath']
  }
};

export const writeFileSchema = {
  name: 'writeFile',
  description: 'Write content to a file in an existing E2B sandbox filesystem.',
  inputSchema: {
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'Sandbox ID returned by createSandbox'
      },
      filePath: {
        type: 'string',
        description: 'Absolute path where the file should be written inside the sandbox (e.g. "/home/user/script.py")'
      },
      content: {
        type: 'string',
        description: 'File content to write'
      }
    },
    required: ['sandboxId', 'filePath', 'content']
  }
};

export const killSandboxSchema = {
  name: 'killSandbox',
  description: 'Kill an existing E2B sandbox and free its resources. Call this when you are done with a sandbox.',
  inputSchema: {
    type: 'object',
    properties: {
      sandboxId: {
        type: 'string',
        description: 'Sandbox ID to kill'
      }
    },
    required: ['sandboxId']
  }
};
