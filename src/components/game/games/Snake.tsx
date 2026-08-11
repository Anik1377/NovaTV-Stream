'use client';

import { useCanvasGame, type CanvasGameAPI } from '../useCanvasGame';

const GRID = 20;
const BASE_INTERVAL = 140;

export function Snake() {
  const { canvasRef, score } = useCanvasGame((api: CanvasGameAPI) => {
    const { canvas, ctx } = api;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cell = Math.floor(Math.min(W, H) / GRID);
    const ox = Math.floor((W - cell * GRID) / 2);
    const oy = Math.floor((H - cell * GRID) / 2);

    type Pt = { x: number; y: number };
    let snake: Pt[] = [{ x: 10, y: 10 }];
    let dir: Pt = { x: 1, y: 0 };
    let nextDir: Pt = { x: 1, y: 0 };
    let food: Pt = { x: 15, y: 10 };
    let dead = false;
    let lastTick = 0;
    let rafId = 0;

    function placeFood() {
      const free: Pt[] = [];
      for (let x = 0; x < GRID; x++)
        for (let y = 0; y < GRID; y++)
          if (!snake.some(s => s.x === x && s.y === y)) free.push({ x, y });
      if (free.length) food = free[Math.floor(Math.random() * free.length)];
    }

    function reset() {
      snake = [{ x: 10, y: 10 }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      dead = false;
      lastTick = 0;
      api.setScore(0);
      placeFood();
    }

    function tick() {
      if (dead) return;
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
        snake.some(s => s.x === head.x && s.y === head.y)) { dead = true; return; }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        api.setScore(api.getScore() + 1);
        placeFood();
      } else {
        snake.pop();
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID; i++) {
        ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + GRID * cell); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, oy + i * cell); ctx.lineTo(ox + GRID * cell, oy + i * cell); ctx.stroke();
      }

      // Food — glowing red
      const fx = ox + food.x * cell + cell / 2;
      const fy = oy + food.y * cell + cell / 2;
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ff3333';
      ctx.beginPath(); ctx.arc(fx, fy, cell * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Snake body — emerald gradient, head brighter
      const p = 1;
      for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];
        const t = snake.length > 1 ? i / (snake.length - 1) : 0;
        const g = Math.round(220 - t * 140);
        const b = Math.round(140 - t * 100);
        ctx.fillStyle = i === 0 ? '#6ee7b7' : `rgb(16,${g},${b})`;
        const r = i === 0 ? 4 : 3;
        roundRect(ctx, ox + s.x * cell + p, oy + s.y * cell + p, cell - p * 2, cell - p * 2, r);
        ctx.fill();
      }
      // Head glow
      ctx.shadowColor = '#34d399'; ctx.shadowBlur = 10;
      ctx.fillStyle = 'transparent';
      const h = snake[0];
      roundRect(ctx, ox + h.x * cell + p, oy + h.y * cell + p, cell - p * 2, cell - p * 2, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Score top-left
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${api.getScore()}`, 14, 28);

      // Game over overlay
      if (dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px system-ui, sans-serif';
        ctx.fillText('Game Over', W / 2, H / 2 - 20);
        ctx.font = '20px system-ui, sans-serif';
        ctx.fillText(`Score: ${api.getScore()}`, W / 2, H / 2 + 18);
        ctx.fillStyle = '#9ca3af';
        ctx.font = '15px system-ui, sans-serif';
        ctx.fillText('Press R to restart', W / 2, H / 2 + 52);
      }
    }

    function loop(t: number) {
      const interval = Math.max(55, BASE_INTERVAL - api.getScore() * 2);
      if (t - lastTick > interval) { tick(); lastTick = t; }
      draw();
      rafId = requestAnimationFrame(loop);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') { reset(); return; }
      if (dead) return;
      const m: Record<string, Pt> = {
        ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
      };
      const nd = m[e.key];
      if (nd && !(nd.x === -dir.x && nd.y === -dir.y)) { nextDir = nd; e.preventDefault(); }
    };

    window.addEventListener('keydown', onKey);
    placeFood();
    rafId = requestAnimationFrame(loop);

    return () => { cancelAnimationFrame(rafId); window.removeEventListener('keydown', onKey); };
  }, []);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
