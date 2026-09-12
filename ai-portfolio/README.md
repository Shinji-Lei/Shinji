# Portfolio AI Chatbot — Backend (your PC) + Frontend (Vercel)

## Structure
```
ai-portfolio/
├── backend/          # Runs on your PC, exposed via Cloudflare Tunnel
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
└── frontend/
    └── AiChatWidget.jsx   # Drop into your existing portfolio (Next.js/React)
```

## Backend setup (on your PC)

```bash
cd backend
npm install
cp .env.example .env
# edit .env: add your ANTHROPIC_API_KEY and ALLOWED_ORIGIN
npm start
```

Test it locally:
```bash
curl -X POST http://localhost:3001/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the capital of Japan?"}'
```

Keep it alive across restarts/reboots with PM2:
```bash
npm install -g pm2
pm2 start server.js --name ai-backend
pm2 startup
pm2 save
```

## Expose it publicly (Cloudflare Tunnel)

Quick test tunnel (temporary URL, no domain needed):
```bash
cloudflared tunnel --url http://localhost:3001
```

Permanent setup (needs a domain in Cloudflare):
```bash
cloudflared tunnel login
cloudflared tunnel create ai-backend
cloudflared tunnel route dns ai-backend api.yourdomain.com
cloudflared tunnel run ai-backend
```

## Frontend setup (on Vercel)

1. Copy `AiChatWidget.jsx` into your portfolio's components folder.
2. Import and render it wherever you want the chat widget:
   ```jsx
   import AiChatWidget from '../components/AiChatWidget';

   export default function Home() {
     return (
       <div>
         {/* ...rest of portfolio... */}
         <AiChatWidget />
       </div>
     );
   }
   ```
3. In Vercel's project settings, add an environment variable:
   - `NEXT_PUBLIC_AI_BACKEND_URL` = your Cloudflare Tunnel URL (e.g. `https://api.yourdomain.com`)
4. Redeploy.

## Notes
- The widget shows a friendly "offline" message if your PC/backend isn't reachable — expected behavior when your PC is off.
- Rate limiting (10 requests/minute/IP) is built into the backend to protect your Claude API usage.
- CORS is locked to `ALLOWED_ORIGIN` in `.env` — set this to your real Vercel domain before going live.
