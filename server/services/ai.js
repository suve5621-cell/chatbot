import { config } from '../config/env.js';

/**
 * Ollama Local LLM Adapter
 * Communicates directly with local Ollama server without any API key or external service.
 */
async function callOllama(messages) {
  const endpoint = `${config.ollamaBaseUrl}/api/chat`;

  const payload = {
    model: config.aiModel,
    messages: [
      { role: 'system', content: config.systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }))
    ],
    stream: false,
    options: {
      num_predict: config.maxOutputTokens
    }
  };

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (netErr) {
    const err = new Error(
      "Ollama is not running. Please start Ollama on your computer (run 'ollama serve' in your terminal or launch the Ollama app)."
    );
    err.status = 503;
    throw err;
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    if (response.status === 404 || /model.*not found/i.test(errorBody)) {
      const err = new Error(
        `Model "${config.aiModel}" is not installed in Ollama. Please run 'ollama pull ${config.aiModel}' in your terminal.`
      );
      err.status = 404;
      throw err;
    }

    const err = new Error(`Ollama error (${response.status}): ${errorBody || response.statusText}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.message?.content || '';
}

/**
 * AI Service entry point
 * One function: generate(messages) -> text
 */
export async function generate(messages) {
  return await callOllama(messages);
}
