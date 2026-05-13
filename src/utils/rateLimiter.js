const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

const ENABLE_RATE_LIMIT = /^(1|true|yes)$/i.test(process.env.ENABLE_RATE_LIMIT || '');

export class RateLimiter {
  constructor(maxPerMinute = 10) {
    this.maxPerMinute = maxPerMinute;
    this.calls = [];
  }

  async check(toolName = 'tool') {
    if (!ENABLE_RATE_LIMIT) return;

    const now = Date.now();
    this.calls = this.calls.filter(t => now - t < 60000);

    if (this.calls.length >= this.maxPerMinute) {
      const error = `Rate limited: ${this.maxPerMinute} calls/minute max (${toolName})`;
      log(error);
      throw new Error(error);
    }

    this.calls.push(now);
  }
}

export const globalRateLimiter = new RateLimiter(10);
