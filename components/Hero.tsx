'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import Ticker from './Ticker';

interface CNode { x: number; y: number; vx: number; vy: number; r: number; active: boolean; phase: number; }
interface Packet { ax: number; ay: number; bx: number; by: number; t: number; speed: number; rgb: [number,number,number]; }

function NetworkCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, raf = 0;
    const packets: Packet[] = [];
    let nodes: CNode[] = [];

    const CENTERS: [number, number][] = [
      [0.22,0.37],[0.46,0.28],[0.50,0.26],[0.82,0.36],
      [0.78,0.44],[0.77,0.53],[0.85,0.69],[0.62,0.44],
      [0.19,0.37],[0.28,0.66],[0.55,0.22],[0.68,0.30],
    ];

    const init = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      nodes = [
        ...CENTERS.map(([rx, ry]) => ({ x: rx*W, y: ry*H, vx:(Math.random()-0.5)*0.06, vy:(Math.random()-0.5)*0.06, r:2.8, active:true, phase:Math.random()*Math.PI*2 })),
        ...Array.from({length:55}, () => ({ x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-0.5)*0.12, vy:(Math.random()-0.5)*0.12, r:1.4, active:Math.random()>0.55, phase:Math.random()*Math.PI*2 })),
      ];
    };

    const addPacket = () => {
      const ai = Math.floor(Math.random()*nodes.length);
      let bi = Math.floor(Math.random()*nodes.length);
      while (bi===ai) bi = Math.floor(Math.random()*nodes.length);
      const palettes: [number,number,number][] = [[0,229,255],[0,255,136],[255,200,87]];
      packets.push({ ax:nodes[ai].x, ay:nodes[ai].y, bx:nodes[bi].x, by:nodes[bi].y, t:0, speed:0.004+Math.random()*0.004, rgb:palettes[Math.floor(Math.random()*palettes.length)] });
    };

    const pktTimer = setInterval(addPacket, 350);
    let time = 0;

    const draw = () => {
      time += 0.016;
      ctx.clearRect(0,0,W,H);

      ctx.strokeStyle='rgba(30,41,59,0.28)'; ctx.lineWidth=0.5;
      for (let x=0;x<W;x+=80) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
      for (let y=0;y<H;y+=80) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

      for (let i=0;i<nodes.length;i++) {
        for (let j=i+1;j<nodes.length;j++) {
          const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, d=Math.sqrt(dx*dx+dy*dy);
          if (d<160) { ctx.strokeStyle=`rgba(30,41,59,${0.7*(1-d/160)})`; ctx.lineWidth=0.4; ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y); ctx.stroke(); }
        }
      }

      for (let i=packets.length-1;i>=0;i--) {
        const p=packets[i]; p.t+=p.speed;
        if (p.t>=1) { packets.splice(i,1); continue; }
        const px=p.ax+(p.bx-p.ax)*p.t, py=p.ay+(p.by-p.ay)*p.t;
        const trailT=Math.max(0,p.t-0.12);
        const tx=p.ax+(p.bx-p.ax)*trailT, ty=p.ay+(p.by-p.ay)*trailT;
        const grad=ctx.createLinearGradient(tx,ty,px,py);
        grad.addColorStop(0,`rgba(${p.rgb.join(',')},0)`); grad.addColorStop(1,`rgba(${p.rgb.join(',')},0.85)`);
        ctx.strokeStyle=grad; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(px,py); ctx.stroke();
        ctx.fillStyle=`rgba(${p.rgb.join(',')},1)`; ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2); ctx.fill();
      }

      nodes.forEach(node => {
        node.x+=node.vx; node.y+=node.vy;
        if (node.x<0||node.x>W) node.vx*=-1;
        if (node.y<0||node.y>H) node.vy*=-1;
        const pulse=Math.sin(time*1.8+node.phase)*0.5+0.5;
        if (node.active) {
          ctx.strokeStyle=`rgba(0,229,255,${pulse*0.22})`; ctx.lineWidth=0.8;
          ctx.beginPath(); ctx.arc(node.x,node.y,node.r+5+pulse*9,0,Math.PI*2); ctx.stroke();
          ctx.shadowBlur=8; ctx.shadowColor='rgba(0,229,255,0.5)';
          ctx.fillStyle=`rgba(0,229,255,${0.65+pulse*0.35})`;
        } else { ctx.shadowBlur=0; ctx.fillStyle='rgba(30,41,59,0.9)'; }
        ctx.beginPath(); ctx.arc(node.x,node.y,node.r,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      });

      raf=requestAnimationFrame(draw);
    };

    init(); draw();
    const onResize = () => init();
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); clearInterval(pktTimer); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full opacity-55" />;
}

function useCounter(target: number, duration = 1600) {
  const [val, setVal] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const step = Math.ceil(target / (duration / 16));
    const id = setInterval(() => {
      setVal(v => { const n = v + step; if (n >= target) { clearInterval(id); return target; } return n; });
    }, 16);
    return () => clearInterval(id);
  }, [started, target, duration]);

  return { val, ref };
}

function StatItem({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const { val, ref } = useCounter(value);
  return (
    <div ref={ref} className="text-center sm:text-left">
      <div className="text-2xl sm:text-3xl font-bold text-n3-text font-mono tabular-nums">{val.toLocaleString()}{suffix}</div>
      <div className="text-xs text-n3-muted mt-1 font-medium tracking-wide">{label}</div>
    </div>
  );
}

const stats = [
  { label: 'Sources Monitored', value: 127, suffix: '+' },
  { label: 'Market Events / Day', value: 2400, suffix: '+' },
  { label: 'Asset Classes', value: 8, suffix: '' },
  { label: 'Predictions Generated', value: 1247, suffix: '' },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-n3-bg">
      <NetworkCanvas />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 65% 45%, rgba(0,229,255,0.055) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-n3-bg pointer-events-none" />

      <div className="relative z-10 flex-1 flex items-center pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1, duration:0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-n3-primary/25 bg-n3-primary/5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-n3-success animate-pulse" />
              <span className="text-xs font-mono font-semibold text-n3-primary tracking-widest uppercase">AI Market Intelligence · Live</span>
            </motion.div>

            <motion.h1 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2, duration:0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-n3-text leading-[1.05] tracking-tight mb-4">
              Market<br />Intelligence.
            </motion.h1>

            <motion.h2 initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.32, duration:0.6 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-n3-primary leading-tight tracking-tight mb-6 text-glow">
              Before Markets React.
            </motion.h2>

            <motion.p initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.44, duration:0.6 }}
              className="text-base sm:text-lg text-n3-muted leading-relaxed max-w-xl mb-10">
              N3RDY continuously scans global news, economic calendars, market sentiment, and financial data
              to identify emerging opportunities and risks before they become obvious. Bloomberg-grade
              intelligence, delivered to Telegram.
            </motion.p>

            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.54, duration:0.6 }}
              className="flex flex-wrap gap-4 mb-16">
              <a href="#report" className="flex items-center gap-2.5 px-6 py-3.5 bg-n3-primary text-n3-bg font-bold rounded-xl hover:bg-n3-primary/90 transition-all shadow-glow-md text-sm">
                <Zap size={16} />View Live Intelligence<ArrowRight size={15} />
              </a>
              <Link href="/dashboard"
                className="flex items-center gap-2.5 px-6 py-3.5 border border-n3-border hover:border-n3-primary/40 bg-n3-card/60 text-n3-text font-semibold rounded-xl transition-all text-sm">
                <LayoutDashboard size={16} />Operator Dashboard
              </Link>
            </motion.div>

            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.7, duration:0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-8 pt-8 border-t border-n3-border/40">
              {stats.map(s => <StatItem key={s.label} {...s} />)}
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.9, duration:0.5 }} className="relative z-10">
        <Ticker />
      </motion.div>
    </section>
  );
}
