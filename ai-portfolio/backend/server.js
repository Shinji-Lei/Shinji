require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
const MAX_QUESTION_LENGTH = 1000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// ---- Middleware ----
app.use(express.json({ limit: '10kb' }));
app.use(
  cors({
    origin: ALLOWED_ORIGIN, // lock to your deployed Vercel domain
    methods: ['POST', 'GET'],
  })
);

// Rate limit: prevent abuse / runaway API costs
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});
app.use('/ask', limiter);

// ---- Routes ----
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'A "question" string is required.' });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return res.status(400).json({ error: `Question too long (max ${MAX_QUESTION_LENGTH} chars).` });
    }

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful AI assistant embedded in a personal portfolio website. ' +
              'You can answer general questions, not just questions about the portfolio owner. ' +
              'Keep answers concise and friendly.',
          },
          { role: 'user', content: question },
        ],
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama responded with status ${ollamaRes.status}`);
    }

    const data = await ollamaRes.json();
    const answer = data?.message?.content ?? 'Sorry, I could not generate a response.';
    res.json({ answer });
  } catch (err) {
    console.error('Error in /ask:', err);
    res.status(500).json({ error: 'Something went wrong processing your question.' });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`AI backend running at http://localhost:${PORT}`);
  console.log(`Allowed origin: ${ALLOWED_ORIGIN}`);
});
