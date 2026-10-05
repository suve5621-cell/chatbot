import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load from server/.env, backend/.env, or root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  aiProvider: 'ollama',
  aiModel: process.env.AI_MODEL || 'qwen2.5:1.5b',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  maxOutputTokens: parseInt(process.env.MAX_OUTPUT_TOKENS || '500', 10),
  systemPrompt: "You are a helpful assistant. Reply in the user's language and style, supporting English, Tamil, and Tanglish. If the user asks in English, reply in English. If the user asks in Tamil or Tanglish, reply in Tamil or Tanglish. Be concise for simple questions, structured for complex ones."
};
