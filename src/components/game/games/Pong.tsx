'use client';

import { useCanvasGame } from '../useCanvasGame';

const WIN_SCORE = 5, PAD_W = 14, PAD_H = 80, BALL_R = 7;

export function Pong() {
  const { canvasRef } = useCanvasGame((api) => {
    const { canvas, ctx, setScore } = api;
    let raf = 0;
    let pScore = 0, aScore = 0, over = false;
    let pY = 0, aY = 0;
    let bx = 0, by = 0, bdx = 4, bdy = 2;
    let mouseY: number | null = null;

    function resetBall(dir: number) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      bx = w / 2; by = h / 2;
      bdx = dir * 4;
      bdy = (Math.random() * 2 - 1) * 3;
      if (Math.abs(bdy) < 1) bdy = 1 * (bdy >= 0 ? 1 : -1);
    }

    function reset() {
      pScore = 0; aScore = 0; over = false; setScore(0);
      pY = canvas.clientHeight / 2;
      aY = canvas.clientHeight / 2;
      mouseY = null;
      resetBall(1);
    }

    function update() {
      if (over) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;

      // Player paddle follows mouse/touch
      if (mouseY !== null) pY = mouseY;
      pY = Math.max(PAD_H / 2, Math.min(h - PAD_H / 2, pY));

      // AI paddle with delay
      const aiSpeed = 3.2;
      const diff = by - aY;
      if (Math.abs(diff) > 8) aY += Math.sign(diff) * Math.min(aiSpeed, Math.abs(diff));
      aY = Math.max(PAD_H / 2, Math.min(h - PAD_H / 2, aY));

      // Ball movement
      bx += bdx; by += bdy;

      // Top/bottom walls
      if (by - BALL_R <= 0) { by = BALL_R; bdy = Math.abs(bdy); }
      if (by + BALL_R >= h) { by = h - BALL_R; bdy = -Math.abs(bdy); }

      // Player paddle (left side)
      const plx = 25;
      if (bx - BALL_R <= plx + PAD_W && bx + BALL_R >= plx && bdx < 0) {
        if (by >= pY - PAD_H / 2 - BALL_R && by <= pY + PAD_H / 2 + BALL_R) {
          bx = plx + PAD_W + BALL_R;
          const hit = (by - pY) / (PAD_H / 2);
          bdx = Math.abs(bdx) * 1.06;
          bdy = hit * 5;
          if (Math.abs(bdy) < 0.8) bdy = 0.8 * (bdy >= 0 ? 1 : -1);
        }
      }

      // AI paddle (right side)
      const arx = w - 25 - PAD_W;
      if (bx + BALL_R >= arx && bx - BALL_R <= arx + PAD_W && bdx > 0) {
        if (by >= aY - PAD_H / 2 - BALL_R && by <= aY + PAD_H / 2 + BALL_R) {
          bx = arx - BALL_R;
          const hit = (by - aY) / (PAD_H / 2);
          bdx = -Math.abs(bdx) * 1.06;
          bdy = hit * 5;
          if (Math.abs(bdy) < 0.8) bdy = 0.8 * (bdy >= 0 ? 1 : -1);
        }
      }

      // Clamp ball speed
      const maxSpd = 14;
      bdx = Math.max(-maxSpd, Math.min(maxSpd, bdx));
      bdy = Math.max(-maxSpd, Math.min(maxSpd, bdy));

      // Scoring
      if (bx + BALL_R < 0) {
        aScore++; setScore(pScore * 100 + aScore);
        if (aScore >= WIN_SCORE) over = true; else resetBall(1);
      }
      if (bx - BALL_R > w) {
        pScore++; setScore(pScore * 100 + aScore);
        if (pScore >= WIN_SCORE) over = true; else resetBall(-1);
      }
    }

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.clientWidth, h = canvas.clientHeight;

      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);

      // Center dashed line
      ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
      ctx.setLineDash([]);

      // Center circle
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2); ctx.stroke();

      // Scores
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.font = 'bold 64px monospace'; ctx.textAlign = 'center';
      ctx.fillText(String(pScore), w / 4, 75);
      ctx.fillText(String(aScore), w * 3 / 4, 75);
      ctx.textAlign = 'left';

      // Labels
      ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'center';
      ctx.fillText('YOU', w / 4, 95);
      ctx.fillText('AI', w * 3 / 4, 95);
      ctx.textAlign = 'left';

      // Player paddle (emerald)
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.roundRect(25, pY - PAD_H / 2, PAD_W, PAD_H, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(27, pY - PAD_H / 2 + 2, 4, PAD_H - 4);

      // AI paddle (gray)
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.roundRect(w - 25 - PAD_W, aY - PAD_H / 2, PAD_W, PAD_H, 7); ctx.fill();

      // Ball with trail effect
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.arc(bx - bdx * 2, by - bdy * 2, BALL_R * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(bx, by, BALL_R, 0, Math.PI * 2); ctx.fill();

      // Controls hint
      ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText('↑↓ Move  |  R Restart', w / 2, h - 10);

      // Win/Lose overlay
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 28px monospace';
        ctx.fillText(pScore >= WIN_SCORE ? 'YOU WIN!' : 'AI WINS!', w / 2, h / 2 - 15);
        ctx.font = '15px monospace'; ctx.fillText(`${pScore} - ${aScore}`, w / 2, h / 2 + 18);
        ctx.fillStyle = '#10b981'; ctx.fillText('Press R to restart', w / 2, h / 2 + 48);
        ctx.textAlign = 'left';
      }
    }

    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') { reset(); e.preventDefault(); return; }
      const step = 28;
      if (e.key === 'ArrowUp') { pY -= step; mouseY = null; }
      else if (e.key === 'ArrowDown') { pY += step; mouseY = null; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
    }

    function onMouse(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseY = e.clientY - rect.top;
    }

    function onTouch(e: TouchEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseY = e.touches[0].clientY - rect.top;
      e.preventDefault();
    }

    reset();
    window.addEventListener('keydown', onKey);
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('touchmove', onTouch, { passive: false });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('touchmove', onTouch);
    };
  });

  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
