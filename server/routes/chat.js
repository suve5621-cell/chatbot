import express from 'express';
import { generate } from '../services/ai.js';
import { prepareMessages } from '../utils/tokens.js';
import { formatFriendlyError } from '../utils/errorHandler.js';
import { config } from '../config/env.js';

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || typeof lastMessage.content !== 'string' || !lastMessage.content.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Token rules: last 8 messages + short running summary of older ones, no duplicates
    const preparedMessages = prepareMessages(messages, config.systemPrompt);

    // Call AI service: generate(messages) -> text
    const text = await generate(preparedMessages);

    return res.json({ response: text });
  } catch (error) {
    console.error('[Chat Error]:', error);
    const { status, error: friendlyMessage } = formatFriendlyError(error);
    return res.status(status).json({ error: friendlyMessage });
  }
});

export default router;
