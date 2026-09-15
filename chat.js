// ── AI CHATBOX ───────────────────────────────────────────
(function(){
  const fab     = document.getElementById('chat-toggle');
  const win     = document.getElementById('chat-window');
  const msgs    = document.getElementById('chat-messages');
  const inp     = document.getElementById('chat-input');
  const sendB   = document.getElementById('chat-send');
  const label   = document.getElementById('chat-fab-label');
  const icoChat = fab.querySelector('.icon-chat');
  const icoX    = fab.querySelector('.icon-close');

  // Backend URL — update this whenever the Cloudflare tunnel URL changes
  const BACKEND_URL = 'https://dubai-system-representatives-reporting.trycloudflare.com';

  // One retry after a short delay smooths over brief tunnel reconnects
  // (the free quick tunnel occasionally drops and re-establishes its connection).
  async function askBackend(text){
    const res = await fetch(`${BACKEND_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: text }),
    });
    if(!res.ok){
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }
    const data = await res.json();
    return data.answer || "Sorry, I couldn't generate a response.";
  }

  // ── Real AI call to the backend (Express -> Ollama), with one retry ──
  async function getReply(text){
    try {
      return await askBackend(text);
    } catch (err) {
      console.warn('AI backend error, retrying once:', err);
      await new Promise((r) => setTimeout(r, 1500));
      try {
        return await askBackend(text);
      } catch (err2) {
        console.error('AI backend error after retry:', err2);
        return "Sorry, the AI assistant is offline right now (The server is in shinji's PC, it might be off). Try again later, or reach out via the Contact section!";
      }
    }
  }

  let open = false, said_hi = false, sending = false;

  // Backdrop
  const bd = document.createElement('div');
  Object.assign(bd.style, {
    position:'fixed', inset:'0', background:'rgba(0,0,0,.55)',
    zIndex:'2147483645', display:'none', touchAction:'auto'
  });
  document.body.appendChild(bd);
  bd.addEventListener('click', close);
  bd.addEventListener('touchend', function(e){ e.preventDefault(); close(); });

  function openChat(){
    open = true;
    win.classList.add('open');
    icoChat.style.display = 'none';
    icoX.style.display    = 'block';
    label.style.display   = 'none';
    if(window.innerWidth < 520) bd.style.display = 'block';
    if(!said_hi){ said_hi = true; addMsg('ai', "Hey! 👋 I'm Shinji's AI assistant. Ask me anything — about him, or anything else!"); }
  }

  function close(){
    open = false;
    win.classList.remove('open');
    icoChat.style.display = 'block';
    icoX.style.display    = 'none';
    label.style.display   = 'block';
    bd.style.display      = 'none';
  }

  fab.addEventListener('click',  function(e){ e.stopPropagation(); open ? close() : openChat(); });
  fab.addEventListener('touchend', function(e){ e.preventDefault(); e.stopPropagation(); open ? close() : openChat(); });

  function addMsg(role, text){
    const row = document.createElement('div');
    row.className = 'msg ' + role;
    const ico = document.createElement('div');
    ico.className = 'msg-icon';
    ico.textContent = role === 'user' ? '👤' : '🤖';
    const bub = document.createElement('div');
    bub.className = 'msg-bubble';
    bub.textContent = text;
    if(role === 'user'){ row.appendChild(bub); row.appendChild(ico); }
    else               { row.appendChild(ico); row.appendChild(bub); }
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping(){
    const row = document.createElement('div');
    row.className = 'msg ai'; row.id = 'typing-row';
    const ico = document.createElement('div');
    ico.className = 'msg-icon'; ico.textContent = '🤖';
    const bub = document.createElement('div');
    bub.className = 'msg-bubble typing-bubble';
    bub.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    row.appendChild(ico); row.appendChild(bub);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function hideTyping(){ const t = document.getElementById('typing-row'); if(t) t.remove(); }

  async function send(text){
    text = (text || '').trim();
    if(!text || sending) return;
    sending = true;

    addMsg('user', text);
    inp.value = '';
    document.getElementById('quick-replies').style.display = 'none';
    showTyping();

    const reply = await getReply(text);

    hideTyping();
    addMsg('ai', reply);
    sending = false;
  }

  function sendQuick(t){ send(t); }
  window.sendQuick = sendQuick;

  sendB.addEventListener('click',   function(){ send(inp.value); });
  sendB.addEventListener('touchend', function(e){ e.preventDefault(); send(inp.value); });
  inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); send(inp.value); } });
})();