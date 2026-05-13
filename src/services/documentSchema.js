export const askDocumentSchema = {
  name: 'askDocument',
  description: 'Extract text from a document URL and answer questions about its content using text models. Combines document extraction with question-answering.',
  inputSchema: {
    type: 'object',
    properties: {
      documentUrl: {
        type: 'string',
        description: 'Public HTTP(S) URL of the document to analyze (HTML, PDF, or text)'
      },
      question: {
        type: 'string',
        description: 'Question to answer based on the document content'
      },
      model: {
        type: 'string',
        description: 'Text model to use for answering (default: "openai")'
      }
    },
    required: ['documentUrl', 'question']
  }
};
