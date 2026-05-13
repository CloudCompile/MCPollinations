const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };

import { retryWithBackoff } from '../utils/retry.js';
import { globalRateLimiter } from '../utils/rateLimiter.js';
import { extractTextFromUrl } from './fileService.js';
import { respondText } from './textService.js';

export async function askDocument(documentUrl, question, model = 'openai', authConfig = null) {
  if (!documentUrl || typeof documentUrl !== 'string') {
    throw new Error('documentUrl is required and must be a string');
  }
  if (!question || typeof question !== 'string') {
    throw new Error('question is required and must be a string');
  }

  await globalRateLimiter.check('askDocument');

  return retryWithBackoff(async () => {
    const { text: documentText, title } = await extractTextFromUrl(documentUrl);

    const combinedPrompt = `Document title: ${title || 'Unknown'}\n\nDocument content:\n${documentText}\n\nQuestion: ${question}\n\nPlease answer the question based on the document content above.`;

    const answer = await respondText(combinedPrompt, model, authConfig);

    return {
      documentUrl,
      title,
      question,
      answer,
      model
    };
  });
}
