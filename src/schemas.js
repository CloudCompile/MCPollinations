/**
 * Central export for all schema definitions
 */

import { generateImageUrlSchema, generateImageSchema, editImageSchema, generateImageFromReferenceSchema, listImageModelsSchema } from './services/imageSchema.js';
import { respondVoidSchema, generateVoidImageSchema, listVoidModelsSchema } from './services/voidSchema.js';
import { respondAudioSchema, listAudioVoicesSchema } from './services/audioSchema.js';
import { respondTextSchema, listTextModelsSchema } from './services/textSchema.js';
import { generateImageBatchSchema } from './services/batchSchema.js';
import { generateVideoSchema } from './services/videoSchema.js';
import { upscaleImageSchema } from './services/cloudinarySchema.js';
import { generateMusicSchema } from './services/musicSchema.js';
import { webSearchSchema, webFetchSchema, extractLinksSchema } from './services/webSchema.js';
import { extractTextFromUrlSchema, compareImagesSchema } from './services/fileSchema.js';
import { askDocumentSchema } from './services/documentSchema.js';
import { savePresetSchema, loadPresetSchema, listPresetsSchema } from './services/presetsSchema.js';
import {
  getSimpleTextSchema,
  postSimpleTextSchema,
  getSimpleImageUrlSchema,
  getSimpleVideoUrlSchema,
  getSimpleAudioUrlSchema,
  createSpeechSchema,
  transcribeAudioFromUrlSchema,
  createEmbeddingsSchema,
  listModelsSchema,
  getAccountDataSchema,
  createAccountKeySchema,
  deleteAccountKeySchema,
  openAiCompatibleGetSchema,
  openAiCompatiblePostSchema
} from './services/endpointSchema.js';


// Re-export all schemas
export {
  // Image schemas
  generateImageUrlSchema,
  generateImageSchema,
  editImageSchema,
  generateImageFromReferenceSchema,
  listImageModelsSchema,

  // Audio schemas
  respondAudioSchema,
  listAudioVoicesSchema,

  // Text schemas
  respondTextSchema,
  listTextModelsSchema,

  // Extended endpoint schemas
  getSimpleTextSchema,
  postSimpleTextSchema,
  getSimpleImageUrlSchema,
  getSimpleVideoUrlSchema,
  getSimpleAudioUrlSchema,
  createSpeechSchema,
  transcribeAudioFromUrlSchema,
  createEmbeddingsSchema,
  listModelsSchema,
  getAccountDataSchema,
  createAccountKeySchema,
  deleteAccountKeySchema,
  openAiCompatibleGetSchema,
  openAiCompatiblePostSchema,

  // VoidAI schemas
  respondVoidSchema,
  generateVoidImageSchema,
  listVoidModelsSchema,

  // Batch image schemas
  generateImageBatchSchema,

  // Video schemas
  generateVideoSchema,

  // Cloudinary schemas
  upscaleImageSchema,

  // Music schemas
  generateMusicSchema,

  // Web schemas
  webSearchSchema,
  webFetchSchema,
  extractLinksSchema,

  // File schemas
  extractTextFromUrlSchema,
  compareImagesSchema,

  // Document Q&A schemas
  askDocumentSchema,

  // Preset schemas
  savePresetSchema,
  loadPresetSchema,
  listPresetsSchema
};

/**
 * Get all tool schemas as an array
 * @returns {Array} Array of all tool schemas
 */
export function getAllToolSchemas() {
  return [
    generateImageUrlSchema,
    generateImageSchema,
    editImageSchema,
    generateImageFromReferenceSchema,
    listImageModelsSchema,
    respondAudioSchema,
    listAudioVoicesSchema,
    respondTextSchema,
    listTextModelsSchema,
    getSimpleTextSchema,
    postSimpleTextSchema,
    getSimpleImageUrlSchema,
    getSimpleVideoUrlSchema,
    getSimpleAudioUrlSchema,
    createSpeechSchema,
    transcribeAudioFromUrlSchema,
    createEmbeddingsSchema,
    listModelsSchema,
    getAccountDataSchema,
    createAccountKeySchema,
    deleteAccountKeySchema,
    openAiCompatibleGetSchema,
    openAiCompatiblePostSchema,
    respondVoidSchema,
    generateVoidImageSchema,
    listVoidModelsSchema,
    generateImageBatchSchema,
    generateVideoSchema,
    upscaleImageSchema,
    generateMusicSchema,
    webSearchSchema,
    webFetchSchema,
    extractLinksSchema,
    extractTextFromUrlSchema,
    compareImagesSchema,
    askDocumentSchema,
    savePresetSchema,
    loadPresetSchema,
    listPresetsSchema
  ];
}
