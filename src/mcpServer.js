import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import {
  generateImageUrl,
  generateImage,
  editImage,
  generateImageFromReference,
  respondAudio,
  listImageModels,
  listTextModels,
  listAudioVoices,
  respondText,
  getSimpleText,
  postSimpleText,
  getSimpleImageUrl,
  getSimpleVideoUrl,
  getSimpleAudioUrl,
  createSpeech,
  transcribeAudioFromUrl,
  createEmbeddings,
  listModels,
  getAccountData,
  createAccountKey,
  deleteAccountKey,
  openAiCompatiblePost,
  openAiCompatibleGet,
  respondVoid,
  generateVoidImage,
  listVoidModels
} from './index.js';
import { getAllToolSchemas } from './schemas.js';
import fs from 'fs';
import path from 'path';
import os from 'os';
import player from 'play-sound';

const DEBUG = /^(1|true|yes)$/i.test(process.env.DEBUG || process.env.MCP_DEBUG || '');
const log = (...args) => { if (DEBUG) { try { console.error(...args); } catch {} } };
const audioPlayer = player({});

function parseBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const v = String(value).toLowerCase();
  if (["1", "true", "yes", "y"].includes(v)) return true;
  if (["0", "false", "no", "n"].includes(v)) return false;
  return fallback;
}

function getAuthConfig() {
  const authConfig = {
    token: process.env.POLLINATIONS_TOKEN || process.env.TOKEN || process.env.token || null,
    referrer: process.env.POLLINATIONS_REFERRER || process.env.REFERRER || process.env.referrer || null
  };

  const finalAuthConfig = (authConfig.token || authConfig.referrer) ? authConfig : null;

  if (finalAuthConfig) {
    log('Auth configuration loaded:', {
      hasToken: !!finalAuthConfig.token,
      hasReferrer: !!finalAuthConfig.referrer
    });
  } else {
    log('No auth configuration found; API requests will fail without token auth.');
  }

  return finalAuthConfig;
}

function getDefaultConfig() {
  const config = {
    image: {
      model: process.env.DEFAULT_IMAGE_MODEL || process.env.IMAGE_MODEL || 'flux',
      width: Number(process.env.DEFAULT_IMAGE_WIDTH || process.env.IMAGE_WIDTH || 1024) || 1024,
      height: Number(process.env.DEFAULT_IMAGE_HEIGHT || process.env.IMAGE_HEIGHT || 1024) || 1024,
      enhance: parseBool(process.env.DEFAULT_IMAGE_ENHANCE ?? process.env.IMAGE_ENHANCE, true),
      safe: parseBool(process.env.DEFAULT_IMAGE_SAFE ?? process.env.IMAGE_SAFE, false)
    },
    text: {
      model: process.env.DEFAULT_TEXT_MODEL || process.env.TEXT_MODEL || 'openai',
      temperature: process.env.DEFAULT_TEXT_TEMPERATURE || process.env.TEXT_TEMPERATURE,
      top_p: process.env.DEFAULT_TEXT_TOP_P || process.env.TEXT_TOP_P,
      system: process.env.DEFAULT_TEXT_SYSTEM || process.env.TEXT_SYSTEM
    },
    audio: {
      voice: process.env.DEFAULT_AUDIO_VOICE || process.env.AUDIO_VOICE || 'alloy'
    },
    void: {
      model: process.env.DEFAULT_VOID_MODEL || process.env.VOID_MODEL || 'gpt-4o-mini'
    },
    resources: {
      output_dir: process.env.OUTPUT_DIR || process.env.DEFAULT_OUTPUT_DIR || './mcpollinations-output'
    }
  };

  log('Default params:', {
    image: config.image,
    text: {
      model: config.text.model,
      temperature: config.text.temperature,
      top_p: config.text.top_p,
      hasSystem: !!config.text.system
    },
    audio: config.audio,
    resources: config.resources
  });

  return config;
}

function getVoidAuthConfig() {
  const apiKey = process.env.VOIDAI_API_KEY || process.env.VOID_API_KEY || null;
  if (apiKey) {
    log('VoidAI auth configuration loaded');
  } else {
    log('No VOIDAI_API_KEY found; VoidAI tools will fail without it.');
  }
  return apiKey ? { apiKey } : null;
}

export function createPollinationsServer() {
  const finalAuthConfig = getAuthConfig();
  const defaultConfig = getDefaultConfig();
  const voidAuthConfig = getVoidAuthConfig();

  const server = new Server(
    {
      name: '@pinkpixel/mcpollinations',
      version: '1.3.1',
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  server.onerror = (error) => log('[MCP Error]', error);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: getAllToolSchemas()
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'generateImageUrl') {
      try {
        const { prompt, model = defaultConfig.image.model, seed, width = defaultConfig.image.width, height = defaultConfig.image.height, enhance = defaultConfig.image.enhance, safe = defaultConfig.image.safe } = args;
        const result = await generateImageUrl(prompt, model, seed, width, height, enhance, safe, finalAuthConfig);
        return {
          content: [
            { type: 'text', text: JSON.stringify(result, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error generating image URL: ${error.message}` }
          ],
          isError: true
        };
      }
    } else if (name === 'generateImage') {
      try {
        const { prompt, model = defaultConfig.image.model, seed, width = defaultConfig.image.width, height = defaultConfig.image.height, enhance = defaultConfig.image.enhance, safe = defaultConfig.image.safe, outputPath = defaultConfig.resources.output_dir, fileName = '', format = 'png' } = args;
        const result = await generateImage(prompt, model, seed, width, height, enhance, safe, outputPath, fileName, format, finalAuthConfig);

        const content = [
          {
            type: 'image',
            data: result.data,
            mimeType: result.mimeType
          }
        ];

        let responseText = `Generated image from prompt: "${prompt}"\n\nImage metadata: ${JSON.stringify(result.metadata, null, 2)}`;

        if (result.filePath) {
          responseText += `\n\nImage saved to: ${result.filePath}`;
        }

        content.push({ type: 'text', text: responseText });

        return { content };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error generating image: ${error.message}` }
          ],
          isError: true
        };
      }
    } else if (name === 'respondAudio') {
      try {
        const { prompt, voice = defaultConfig.audio.voice, seed, voiceInstructions } = args;
        const result = await respondAudio(prompt, voice, seed, voiceInstructions, finalAuthConfig);

        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `pollinations-audio-${Date.now()}.mp3`);

        fs.writeFileSync(tempFilePath, Buffer.from(result.data, 'base64'));

        audioPlayer.play(tempFilePath, (err) => {
          if (err) log('Error playing audio:', err);

          try {
            fs.unlinkSync(tempFilePath);
          } catch (cleanupErr) {
            log('Error cleaning up temp file:', cleanupErr);
          }
        });

        return {
          content: [
            {
              type: 'text',
              text: `Audio has been played.\n\nAudio metadata: ${JSON.stringify(result.metadata, null, 2)}`
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error generating audio: ${error.message}` }
          ],
          isError: true
        };
      }
    } else if (name === 'listImageModels') {
      try {
        const result = await listImageModels(finalAuthConfig);
        return {
          content: [
            { type: 'text', text: JSON.stringify(result, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error listing image models: ${error.message}` }
          ],
          isError: true
        };
      }
    } else if (name === 'listTextModels') {
      try {
        const result = await listTextModels(finalAuthConfig);
        return {
          content: [
            { type: 'text', text: JSON.stringify(result, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error listing text models: ${error.message}` }
          ],
          isError: true
        };
      }
    } else if (name === 'listAudioVoices') {
      try {
        const result = await listAudioVoices();
        return {
          content: [
            { type: 'text', text: JSON.stringify(result, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error listing audio voices: ${error.message}` }
          ],
          isError: true
        };
      }
    } else if (name === 'respondText') {
      try {
        const { prompt, model = defaultConfig.text.model, seed, temperature = defaultConfig.text.temperature ? Number(defaultConfig.text.temperature) : undefined, top_p = defaultConfig.text.top_p ? Number(defaultConfig.text.top_p) : undefined, system = defaultConfig.text.system } = args;
        const result = await respondText(prompt, model, seed, temperature, top_p, system, finalAuthConfig);
        return {
          content: [
            { type: 'text', text: result }
          ]
        };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error generating text response: ${error.message}` }
          ],
          isError: true
        };
      }

    } else if (name === 'editImage') {
      try {
        const { prompt, imageUrl, model = 'kontext', seed, width = defaultConfig.image.width, height = defaultConfig.image.height, enhance = defaultConfig.image.enhance, safe = defaultConfig.image.safe, outputPath = defaultConfig.resources.output_dir, fileName = '', format = 'png' } = args;
        const result = await editImage(prompt, imageUrl, model, seed, width, height, enhance, safe, outputPath, fileName, format, finalAuthConfig);

        const content = [
          {
            type: 'image',
            data: result.data,
            mimeType: result.mimeType
          }
        ];

        let responseText = `Edited image from prompt: "${prompt}"\nInput image: ${imageUrl}\n\nImage metadata: ${JSON.stringify(result.metadata, null, 2)}`;

        if (result.filePath) {
          responseText += `\n\nImage saved to: ${result.filePath}`;
        }

        content.push({
          type: 'text',
          text: responseText
        });

        return { content };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error editing image: ${error.message}` }
          ],
          isError: true
        };
      }

    } else if (name === 'generateImageFromReference') {
      try {
        const { prompt, imageUrl, model = 'kontext', seed, width = defaultConfig.image.width, height = defaultConfig.image.height, enhance = defaultConfig.image.enhance, safe = defaultConfig.image.safe, outputPath = defaultConfig.resources.output_dir, fileName = '', format = 'png' } = args;
        const result = await generateImageFromReference(prompt, imageUrl, model, seed, width, height, enhance, safe, outputPath, fileName, format, finalAuthConfig);

        const content = [
          {
            type: 'image',
            data: result.data,
            mimeType: result.mimeType
          }
        ];

        let responseText = `Generated image from reference: "${prompt}"\nReference image: ${imageUrl}\n\nImage metadata: ${JSON.stringify(result.metadata, null, 2)}`;

        if (result.filePath) {
          responseText += `\n\nImage saved to: ${result.filePath}`;
        }

        content.push({
          type: 'text',
          text: responseText
        });

        return { content };
      } catch (error) {
        return {
          content: [
            { type: 'text', text: `Error generating image from reference: ${error.message}` }
          ],
          isError: true
        };
      }

    } else if (name === 'getSimpleText') {
      try {
        const { prompt, query = {} } = args;
        const result = await getSimpleText(prompt, query, finalAuthConfig);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error generating simple text: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'postSimpleText') {
      try {
        const { prompt, model = defaultConfig.text.model } = args;
        const result = await postSimpleText(prompt, model, finalAuthConfig);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error generating simple text via POST: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'getSimpleImageUrl') {
      try {
        const { prompt, query = {} } = args;
        const imageUrl = getSimpleImageUrl(prompt, query);
        return { content: [{ type: 'text', text: imageUrl }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error generating simple image URL: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'getSimpleVideoUrl') {
      try {
        const { prompt, query = {} } = args;
        const videoUrl = getSimpleVideoUrl(prompt, query);
        return { content: [{ type: 'text', text: videoUrl }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error generating simple video URL: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'getSimpleAudioUrl') {
      try {
        const { text, query = {} } = args;
        const audioUrl = getSimpleAudioUrl(text, query);
        return { content: [{ type: 'text', text: audioUrl }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error generating simple audio URL: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'createSpeech') {
      try {
        const { input, model = 'qwen-tts', voice = defaultConfig.audio.voice } = args;
        const result = await createSpeech(input, model, voice, finalAuthConfig);
        return {
          content: [
            { type: 'text', text: JSON.stringify({ ...result, metadata: { model, voice } }, null, 2) }
          ]
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error creating speech: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'transcribeAudioFromUrl') {
      try {
        const { audioUrl, model = 'whisper' } = args;
        const result = await transcribeAudioFromUrl(audioUrl, model, finalAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error transcribing audio: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'createEmbeddings') {
      try {
        const { input, model = 'openai-3-small', dimensions } = args;
        const result = await createEmbeddings(input, model, dimensions, finalAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error creating embeddings: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'listModels') {
      try {
        const { endpoint = 'v1' } = args;
        const result = await listModels(endpoint, finalAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error listing models: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'getAccountData') {
      try {
        const { endpoint = 'profile', query = {} } = args;
        const result = await getAccountData(endpoint, query, finalAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error reading account data: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'createAccountKey') {
      try {
        const { payload } = args;
        const result = await createAccountKey(payload, finalAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error creating account key: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'deleteAccountKey') {
      try {
        const { id } = args;
        const result = await deleteAccountKey(id, finalAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error deleting account key: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'openAiCompatibleGet') {
      try {
        const { path, query = {} } = args;
        const result = await openAiCompatibleGet(path, query, finalAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error performing GET request: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'openAiCompatiblePost') {
      try {
        const { path, payload = {} } = args;
        const result = await openAiCompatiblePost(path, payload, finalAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error performing POST request: ${error.message}` }],
          isError: true
        };
      }

    } else if (name === 'respondVoid') {
      try {
        const { prompt, model = defaultConfig.void?.model ?? 'gpt-4o-mini', seed, temperature, top_p, system } = args;
        const result = await respondVoid(prompt, model, seed, temperature ?? null, top_p ?? null, system ?? null, voidAuthConfig);
        return { content: [{ type: 'text', text: result }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error calling VoidAI: ${error.message}` }], isError: true };
      }

    } else if (name === 'generateVoidImage') {
      try {
        const { prompt, model = 'gpt-image-1', size = '1024x1024', quality = 'standard', n = 1 } = args;
        const result = await generateVoidImage(prompt, model, size, quality, n, voidAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error generating VoidAI image: ${error.message}` }], isError: true };
      }

    } else if (name === 'listVoidModels') {
      try {
        const result = await listVoidModels(voidAuthConfig);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: 'text', text: `Error listing VoidAI models: ${error.message}` }], isError: true };
      }

    } else {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${name}`
      );
    }
  });

  return server;
}
