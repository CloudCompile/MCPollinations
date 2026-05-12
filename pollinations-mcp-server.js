#!/usr/bin/env node

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
log(`Running on Node.js version: ${nodeVersion}`);

if (majorVersion < 16) {
  if (typeof global.AbortController === 'undefined') {
    log('Adding AbortController polyfill for Node.js < 16');
    try {
      try {
        const { AbortController: AbortControllerPolyfill } = await import('node-abort-controller');
        global.AbortController = AbortControllerPolyfill;
      } catch {
        log('Using basic AbortController polyfill');

        class AbortSignal {
          constructor() {
            this.aborted = false;
            this.onabort = null;
            this._eventListeners = {};
          }

          addEventListener(type, listener) {
            if (!this._eventListeners[type]) {
              this._eventListeners[type] = [];
            }
            this._eventListeners[type].push(listener);
          }

          removeEventListener(type, listener) {
            if (!this._eventListeners[type]) return;
            this._eventListeners[type] = this._eventListeners[type].filter(l => l !== listener);
          }

          dispatchEvent(event) {
            if (event.type === 'abort' && this.onabort) {
              this.onabort(event);
            }

            if (this._eventListeners[event.type]) {
              this._eventListeners[event.type].forEach(listener => listener(event));
            }
          }
        }

        global.AbortController = class AbortController {
          constructor() {
            this.signal = new AbortSignal();
          }

          abort() {
            if (this.signal.aborted) return;
            this.signal.aborted = true;
            const event = { type: 'abort' };
            this.signal.dispatchEvent(event);
          }
        };
      }
    } catch (error) {
      if (DEBUG) {
        log('Failed to add AbortController polyfill:', error);
        log('This package requires Node.js >= 16. Please upgrade your Node.js version.');
      }
      process.exit(1);
    }
  }
}

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPollinationsServer } from './src/mcpServer.js';

const server = createPollinationsServer();

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log('MCPollinations MCP server running on stdio');
}

run().catch(console.error);
