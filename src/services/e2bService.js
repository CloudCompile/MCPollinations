/**
 * E2B Code Interpreter Service
 *
 * Stateless sandbox operations — sandboxId is returned to the caller
 * and must be passed back in for subsequent operations. This design
 * survives container restarts since no in-memory session state is kept.
 */

import { Sandbox } from '@e2b/code-interpreter';

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

function getApiKey(e2bAuthConfig) {
  const key = e2bAuthConfig?.apiKey || process.env.E2B_API_KEY;
  if (!key) {
    throw new Error('E2B API key is required. Set E2B_API_KEY in environment or pass apiKey in auth config.');
  }
  return key;
}

/**
 * Creates a new E2B sandbox and returns its ID.
 * The caller must store the sandboxId and pass it back for subsequent calls.
 *
 * @param {string} [template='base'] - Sandbox template name
 * @param {number} [timeoutMs=300000] - Sandbox idle timeout in milliseconds (default 5 min)
 * @param {Object} [e2bAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<Object>} - { sandboxId, template, timeoutMs }
 */
export async function createSandbox(template = 'base', timeoutMs = 300000, e2bAuthConfig = null) {
  const apiKey = getApiKey(e2bAuthConfig);
  const sandbox = await Sandbox.create({
    apiKey,
    template,
    timeoutMs
  });
  log('Created sandbox:', sandbox.sandboxId);
  return {
    sandboxId: sandbox.sandboxId,
    template,
    timeoutMs
  };
}

/**
 * Runs code in an existing sandbox.
 *
 * @param {string} sandboxId - Sandbox ID returned by createSandbox
 * @param {string} code - Code to execute
 * @param {string} [language='python'] - Language kernel to use
 * @param {Object} [e2bAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<Object>} - { stdout, stderr, results, error, sandboxId }
 */
export async function runCode(sandboxId, code, language = 'python', e2bAuthConfig = null) {
  if (!sandboxId) throw new Error('sandboxId is required');
  if (!code) throw new Error('code is required');

  const apiKey = getApiKey(e2bAuthConfig);
  const sandbox = await Sandbox.connect(sandboxId, { apiKey });

  log('Running code in sandbox:', sandboxId, 'language:', language);
  const execution = await sandbox.runCode(code, { language });

  return {
    sandboxId,
    stdout: execution.logs?.stdout?.join('\n') ?? '',
    stderr: execution.logs?.stderr?.join('\n') ?? '',
    results: execution.results ?? [],
    error: execution.error ? {
      name: execution.error.name,
      value: execution.error.value,
      traceback: execution.error.traceback
    } : null
  };
}

/**
 * Installs packages in an existing sandbox.
 * Uses pip for Python and npm for Node.js.
 *
 * @param {string} sandboxId - Sandbox ID
 * @param {string|string[]} packages - Package name(s) to install
 * @param {string} [language='python'] - Language/package manager context
 * @param {Object} [e2bAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<Object>} - { sandboxId, stdout, stderr, success }
 */
export async function installPackage(sandboxId, packages, language = 'python', e2bAuthConfig = null) {
  if (!sandboxId) throw new Error('sandboxId is required');
  if (!packages) throw new Error('packages is required');

  const apiKey = getApiKey(e2bAuthConfig);
  const sandbox = await Sandbox.connect(sandboxId, { apiKey });

  const pkgList = Array.isArray(packages) ? packages.join(' ') : packages;
  log('Installing packages in sandbox:', sandboxId, pkgList);

  let installCmd;
  if (language === 'python') {
    installCmd = `!pip install -q ${pkgList}`;
  } else if (language === 'javascript' || language === 'typescript' || language === 'nodejs') {
    installCmd = `import subprocess; subprocess.run(['npm', 'install', ...${JSON.stringify(pkgList.split(' '))}])`;
  } else {
    installCmd = `!pip install -q ${pkgList}`;
  }

  const execution = await sandbox.runCode(installCmd);

  return {
    sandboxId,
    stdout: execution.logs?.stdout?.join('\n') ?? '',
    stderr: execution.logs?.stderr?.join('\n') ?? '',
    success: !execution.error
  };
}

/**
 * Reads a file from a sandbox.
 *
 * @param {string} sandboxId - Sandbox ID
 * @param {string} filePath - Absolute path to the file inside the sandbox
 * @param {Object} [e2bAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<Object>} - { sandboxId, filePath, content }
 */
export async function readFile(sandboxId, filePath, e2bAuthConfig = null) {
  if (!sandboxId) throw new Error('sandboxId is required');
  if (!filePath) throw new Error('filePath is required');

  const apiKey = getApiKey(e2bAuthConfig);
  const sandbox = await Sandbox.connect(sandboxId, { apiKey });

  log('Reading file from sandbox:', sandboxId, filePath);
  const content = await sandbox.files.read(filePath);

  return {
    sandboxId,
    filePath,
    content: typeof content === 'string' ? content : Buffer.from(content).toString('utf8')
  };
}

/**
 * Writes a file to a sandbox.
 *
 * @param {string} sandboxId - Sandbox ID
 * @param {string} filePath - Absolute path where the file should be written inside the sandbox
 * @param {string} content - File content to write
 * @param {Object} [e2bAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<Object>} - { sandboxId, filePath, bytesWritten }
 */
export async function writeFile(sandboxId, filePath, content, e2bAuthConfig = null) {
  if (!sandboxId) throw new Error('sandboxId is required');
  if (!filePath) throw new Error('filePath is required');
  if (content === undefined || content === null) throw new Error('content is required');

  const apiKey = getApiKey(e2bAuthConfig);
  const sandbox = await Sandbox.connect(sandboxId, { apiKey });

  log('Writing file to sandbox:', sandboxId, filePath);
  await sandbox.files.write(filePath, content);

  return {
    sandboxId,
    filePath,
    bytesWritten: Buffer.byteLength(content, 'utf8')
  };
}

/**
 * Kills an existing sandbox and frees its resources.
 *
 * @param {string} sandboxId - Sandbox ID to kill
 * @param {Object} [e2bAuthConfig] - Auth config with { apiKey }
 * @returns {Promise<Object>} - { sandboxId, killed: true }
 */
export async function killSandbox(sandboxId, e2bAuthConfig = null) {
  if (!sandboxId) throw new Error('sandboxId is required');

  const apiKey = getApiKey(e2bAuthConfig);
  const sandbox = await Sandbox.connect(sandboxId, { apiKey });

  log('Killing sandbox:', sandboxId);
  await sandbox.kill();

  return {
    sandboxId,
    killed: true
  };
}
