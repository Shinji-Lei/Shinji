// ── CANVAS SETUP ────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
let W, H;

function resize(){
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
  buildStars();
  buildConstellations();
}

// ── STARFIELD ───────────────────────────────────────────
class Star {
  constructor(){ this.reset(); }
  reset(){
    this.x = Math.random()*W;
    this.y = Math.random()*H;
    this.r = Math.random()*1.1+.3;
    this.baseOp = Math.random()*.5+.15;
    this.ph = Math.random()*Math.PI*2;
    this.sp = Math.random()*.015+.005;
    this.col = Math.random() < .12 ? '#E6228A' : '#e8f0f8';
    const a = Math.random()*Math.PI*2;
    const speed = Math.random()*.08+.02;
    this.vx = Math.cos(a)*speed;
    this.vy = Math.sin(a)*speed - .015; // slight upward drift
  }
  update(){
    this.ph += this.sp;
    this.x += this.vx;
    this.y += this.vy;
    if(this.x < -5) this.x = W+5;
    if(this.x > W+5) this.x = -5;
    if(this.y < -5) this.y = H+5;
    if(this.y > H+5) this.y = -5;
  }
  draw(){
    const op = this.baseOp*(0.5+0.5*Math.sin(this.ph));
    ctx.save();
    ctx.globalAlpha = op;
    ctx.fillStyle = this.col;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}
let stars = [];
function buildStars(){
  stars = [];
  const N = Math.min(220, Math.floor(W*H/6000));
  for(let i=0;i<N;i++) stars.push(new Star());
}

// ── ZODIAC CONSTELLATIONS ────────────────────────────────
// Simplified star-and-line glyphs, normalized to a 0–1 box
const ZODIAC_SHAPES = [
  { pts:[[0,0.5],[0.28,0.32],[0.55,0.2],[0.85,0.05],[1,0]], edges:[[0,1],[1,2],[2,3],[3,4]] },                     // Aries
  { pts:[[0,0.85],[0.18,0.55],[0.4,0.35],[0.6,0.1],[0.82,0.32],[1,0.6],[0.6,0.6]], edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[4,6],[2,6]] }, // Leo
  { pts:[[0.05,0],[0.05,0.4],[0.05,0.85],[0.45,0],[0.45,0.4],[0.45,0.85]], edges:[[0,1],[1,2],[3,4],[4,5],[2,5]] }, // Gemini
  { pts:[[0.5,0],[0,0.5],[1,0.5],[0.5,1]], edges:[[0,1],[0,2],[1,3],[2,3]] },                                       // Libra
  { pts:[[0,1],[0.3,0.62],[0.55,0.3],[1,0],[0.5,0.55]], edges:[[0,1],[1,2],[2,3],[1,4]] },                         // Sagittarius
  { pts:[[0,0.5],[0.25,0.18],[0.5,0.62],[0.75,0.28],[1,0.5]], edges:[[0,1],[1,2],[2,3],[3,4]] },                   // Aquarius
];

class Constellation {
  constructor(shape, cx, cy, size, depth){
    this.shape = shape;
    this.cx = cx; this.cy = cy; this.size = size; this.depth = depth;
    this.ph = Math.random()*Math.PI*2;
    this.sp = Math.random()*.6+.3;
    const a = Math.random()*Math.PI*2;
    const speed = Math.random()*.06+.015;
    this.vx = Math.cos(a)*speed;
    this.vy = Math.sin(a)*speed - .01; // slight upward drift
    this.jitterAngle = Math.random()*Math.PI*2;
    this.jitterSpeed = Math.random()*.04+.01;
    this.jitterRadius = 10 + Math.random()*14;
  }
  points(ox, oy){
    return this.shape.pts.map(([x,y]) => ({
      x: this.cx + ox + (x-0.5)*this.size,
      y: this.cy + oy + (y-0.5)*this.size
    }));
  }
  update(){
    this.cx += this.vx;
    this.cy += this.vy;
    const half = this.size/2;
    if(this.cx < -half) this.cx = W+half;
    if(this.cx > W+half) this.cx = -half;
    if(this.cy < -half) this.cy = H+half;
    if(this.cy > H+half) this.cy = -half;
  }
  draw(time){
    const ox = Math.cos(time*this.jitterSpeed + this.jitterAngle) * this.jitterRadius;
    const oy = Math.sin(time*this.jitterSpeed*0.8 + this.jitterAngle) * this.jitterRadius;
    const pts = this.points(ox, oy);

    // connecting lines
    ctx.save();
    ctx.strokeStyle = 'rgba(230,34,138,.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    this.shape.edges.forEach(([a,b])=>{
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
    });
    ctx.stroke();

    // star nodes
    pts.forEach((p,i)=>{
      const tw = 0.55 + 0.45*Math.sin(time*this.sp + this.ph + i*1.3);
      const r = 1.4 + tw*1.1;
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*4);
      g.addColorStop(0, 'rgba(252,228,239,'+(0.55*tw)+')');
      g.addColorStop(1, 'rgba(230,34,138,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x,p.y,r*4,0,Math.PI*2); ctx.fill();

      ctx.globalAlpha = 0.6 + 0.4*tw;
      ctx.fillStyle = '#fce4ef';
      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }
}

let constellations = [];
function buildConstellations(){
  constellations = [];
  const isMobile = W < 768;
  const layout = isMobile
    ? [[0.5,0.18,0.55],[0.22,0.55,0.4],[0.8,0.62,0.42],[0.5,0.88,0.35]]
    : [[0.8,0.26,0.32],[0.6,0.6,0.4],[0.9,0.7,0.28],[0.28,0.78,0.3],[0.14,0.32,0.24]];
  layout.forEach(([px,py,size], i)=>{
    const shape = ZODIAC_SHAPES[i % ZODIAC_SHAPES.length];
    constellations.push(new Constellation(shape, px*W, py*H, size*Math.min(W,H), 0.3+Math.random()*0.5));
  });
}

resize();
window.addEventListener('resize', resize);

// ── RENDER LOOP ─────────────────────────────────────────
let time = 0;
function animate(){
  time += 0.016;
  ctx.clearRect(0,0,W,H);
  stars.forEach(s=>{ s.update(); s.draw(); });
  constellations.forEach(c=>{ c.update(); c.draw(time); });
  requestAnimationFrame(animate);
}
animate();

// ── SCROLL REVEAL ────────────────────────────────────────
const reveals=document.querySelectorAll('.reveal');
reveals.forEach(el=>
  new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
  },{threshold:.12}).observe(el)
);