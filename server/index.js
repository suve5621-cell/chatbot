import express from 'express';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import { config } from './config/env.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: config.aiProvider,
    model: config.aiModel
  });
});

// API Routes
app.use('/api', chatRouter);

// Fallback error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port} (Provider: ${config.aiProvider}, Model: ${config.aiModel})`);
});
