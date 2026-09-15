require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Trust the first proxy hop (Cloudflare Tunnel) so express-rate-limit can
// safely read X-Forwarded-For without throwing a validation error.
app.set('trust proxy', 1);

// ---- Config ----
const PORT = process.env.PORT || 3001;
// Comma-separated list in .env, e.g.: http://127.0.0.1:5500,https://shinji-pu6z.vercel.app
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());
const MAX_QUESTION_LENGTH = 1000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

// ---- Who the AI is representing ----
// Edit this freely — it's injected as context on every question so the AI
// can answer accurately about Shinji specifically, not just generically.
const SYSTEM_PROMPT = `You are Shinji's AI assistant, embedded in his personal portfolio website.
You can answer general questions too, not just questions about Shinji — but when asked about him, use the facts below. Keep answers concise, friendly, and use a couple of emojis where natural.

About Shinji:
- Full name / goes by: Shinji
- Role: IT student and web developer
- School: Cebu Eastern College (CEC), Cebu, Philippines
- Course: Information Technology
- Focus: Full-stack web development
- Status: Open to work / available for opportunities
- Contact: shinjileicalvo@gmail.com, GitHub (github.com/Shinji-Lei), Facebook (facebook.com/shinji201)

Skills:
- Backend: C#, ASP.NET Core (Minimal API), Entity Framework Core, REST APIs, session-based authentication
- Frontend: HTML5, CSS3, JavaScript, React, glassmorphism/dark UI, CSS animations
- Database: SQL Server, EF Core migrations, in-memory storage (ConcurrentDictionary), JSON
- Tools: Git, GitHub, VS Code, Visual Studio, IntelliJ IDEA, MySQL Workbench
- Design: Dark themes, Three.js, Canvas API, responsive design

Coursework: Web Systems Technology, Capstone Project, Web Programming, Object-Oriented Programming, Platform Technologies, Information Management, Human Computer Interaction

Projects:
1. CEC Grade System (Capstone, featured) — a student grade management system with session-based auth (admin/teacher roles), enrollment management, and an in-memory REST API backend built in ASP.NET Core Minimal API. Successfully defended.
2. E-Commerce site — an online shop built with React and ASP.NET Core, with Swagger API docs integration.
3. Enrollment System — an online enrollment/request system for a school, built with ASP.NET Core, Entity Framework Core, SQL Server, and a service-layer architecture.
4. MDHUB — an e-learning module/lesson library with a public browsing side and secured admin panel. Admins upload PDFs and manage accounts; students browse/download lessons. Built with Spring Boot, Spring Security (session auth, BCrypt), MySQL, vanilla JS frontend, deployed on Railway. Live at mdhub-production-7597.up.railway.app.

Personality notes: Shinji has a sharp eye for dark-themed, glassmorphism UI design and enjoys adding small creative touches (like animated particle effects) to his projects. He's a Naruto fan and sometimes draws inspiration from anime. He's Christian and sometimes adds small faith-related touches to his work.

If asked something you don't know about Shinji specifically, say you're not sure and suggest reaching out via the Contact section. For general knowledge questions unrelated to Shinji, just answer normally and helpfully.`;

// ---- Middleware ----
app.use(express.json({ limit: '10kb' }));

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, server-to-server) and any listed origin
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));
// Explicitly handle preflight OPTIONS requests for every route
app.options('*', cors(corsOptions));

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
            content: SYSTEM_PROMPT,
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
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});