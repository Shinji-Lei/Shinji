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

  let open = false, said_hi = false;

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
    if(!said_hi){ said_hi = true; addMsg('ai', "Hey! 👋 I'm Shinji's AI assistant. Ask me about his skills, projects, or how to hire him!"); }
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

  // Knowledge base
  const KB = [
    { k:['who','name','about','yourself','introduce'], r:"I'm Shinji — an IT student & web developer from Cebu Eastern College, Philippines 🇵🇭. I build full-stack web systems with C# ASP.NET Core backends and polished dark-themed frontends. Passionate about clean code and great UI!" },
    { k:['skill','tech','stack','language','tools','know','use'], r:"Shinji's stack: C#, ASP.NET Core Minimal API, Entity Framework Core, REST API, HTML/CSS/JS, React, Three.js, Canvas API, SQL Server, Git & Swagger. He also specializes in dark UI — glassmorphism, animations & responsive design! ⚡" },
    { k:['project','built','work','made','capstone','grade','studyflow','barangay','dashboard'], r:"Shinji has 4 major projects:\n\n1️⃣ CEC Grade System (Capstone — PASSED!) — C# Minimal API, session auth, enrollment module\n2️⃣ StudyFlow — React + ASP.NET Core study planner\n3️⃣ Barangay Complaint System — EF Core + SQL Server\n4️⃣ Admin Dashboards — dark UI, glassmorphism, Three.js" },
    { k:['hire','job','freelance','available','opportunity','price','rate','cost'], r:"Shinji is open to freelance & job opportunities! 💼 He specializes in full-stack web dev — from API design to polished frontends. Hit the Contact section to reach him directly!" },
    { k:['contact','email','reach','message','connect','linkedin','github'], r:"Reach Shinji through the Contact section on this page 📬 — Email, GitHub, or LinkedIn buttons are right there. He's responsive and loves new collaborations!" },
    { k:['school','college','cec','cebu','course','study','it'], r:"Shinji studies Information Technology at Cebu Eastern College (CEC), Cebu, Philippines 🎓. He's in Group 6 and already defended his capstone — the CEC Grade System!" },
    { k:['design','ui','ux','dark','theme','css','animation','aesthetic','style'], r:"Shinji has a sharp eye for design 🎨 — dark themes, glassmorphism, cyan palettes, hover animations & particle effects (like the spaceship on this page!). Every detail is intentional." },
    { k:['spaceship','particle','3d','canvas','effect'], r:"That spaceship? Pure Shinji 🛸 — a 3D particle system built with Canvas API. Thousands of particles shaped into a spaceship with wings, engine pods & cockpit glow. Zero libraries, pure JavaScript!" },
    { k:['anime','naruto','hobby','interest','christian','bible','faith'], r:"Fun fact — Shinji loves anime (especially Naruto 🍥) and sometimes draws design inspiration from it. He also adds Christian touches like rotating Bible verses to his projects. Faith meets code! ✝️" },
    { k:['backend','api','server','asp','dotnet','c#','csharp','minimal'], r:"Backend-wise: C# + ASP.NET Core Minimal API, REST APIs in clean Program.cs setups, session auth, middleware, routing, EF Core migrations & SQL Server. He's comfortable with the whole stack 🔧" },
    { k:['hello','hi','hey','sup','morning','afternoon','night','good'], r:"Hey hey! 👋 I'm Shinji's AI assistant — ask me anything about his skills, projects, or how to work with him! 😊" },
    { k:['thank','thanks','awesome','cool','great','nice','wow','amazing'], r:"You're welcome! 😊 Shinji puts a lot of heart into his work. Feel free to reach out via the Contact section anytime!" },
  ];

  function getReply(text){
    const t = text.toLowerCase();
    for(const e of KB) if(e.k.some(k => t.includes(k))) return e.r;
    return "Great question! 🤔 I'm not 100% sure about that — reach out to Shinji directly via the Contact section and he'll be happy to answer! 😊";
  }

  function send(text){
    text = (text || '').trim();
    if(!text) return;
    addMsg('user', text);
    inp.value = '';
    document.getElementById('quick-replies').style.display = 'none';
    showTyping();
    setTimeout(function(){ hideTyping(); addMsg('ai', getReply(text)); }, 800 + Math.random()*600);
  }

  function sendQuick(t){ send(t); }
  window.sendQuick = sendQuick;

  sendB.addEventListener('click',   function(){ send(inp.value); });
  sendB.addEventListener('touchend', function(e){ e.preventDefault(); send(inp.value); });
  inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); send(inp.value); } });
})();