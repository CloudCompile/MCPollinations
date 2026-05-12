/**
 * Standalone HTTP server for Hugging Face Spaces deployment.
 * Replaces the Vercel api/mcp.js handler.
 *
 * HF Spaces exposes port 7860 by default.
 * Set PORT env var to override.
 */

import http from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createPollinationsServer } from './src/mcpServer.js';

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

const PORT = Number(process.env.PORT) || 7860;

async function readBody(req) {
  if (req.method !== 'POST') return undefined;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return undefined;
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Session-Id');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Bearer token auth — set HF_TOKEN env var to restrict access
  const hfToken = process.env.HF_TOKEN;
  if (hfToken) {
    const authHeader = req.headers['authorization'] || '';
    const provided = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (provided !== hfToken) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Unauthorized' },
        id: null
      }));
      return;
    }
  }

  if (!['GET', 'POST', 'DELETE'].includes(req.method || '')) {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Method not allowed.' },
      id: null
    }));
    return;
  }

  const mcpServer = createPollinationsServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  try {
    const parsedBody = await readBody(req);
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, parsedBody);
    res.on('close', () => {
      transport.close().catch((err) => log('Transport close error:', err));
      mcpServer.close().catch((err) => log('Server close error:', err));
    });
  } catch (error) {
    log('Request error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null
      }));
    }
    await transport.close().catch(() => {});
    await mcpServer.close().catch(() => {});
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MCPollinations MCP server listening on port ${PORT}`);
});
