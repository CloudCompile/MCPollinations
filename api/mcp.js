import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createPollinationsServer } from '../src/mcpServer.js';

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

async function getParsedBody(req) {
  // Vercel may provide req.body pre-parsed for JSON requests; if not,
  // manually read and parse the raw request stream for POST requests.
  if (req.body !== undefined) {
    return req.body;
  }

  if (req.method !== 'POST') {
    return undefined;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return undefined;
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export const config = {
  runtime: 'nodejs'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Session-Id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null
    });
    return;
  }

  const server = createPollinationsServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  try {
    const parsedBody = await getParsedBody(req);
    await server.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
    res.on('close', () => {
      transport.close().catch((error) => log('Transport close error:', error));
      server.close().catch((error) => log('Server close error:', error));
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null
      });
    }
    await transport.close();
    await server.close();
  }
}
