'use client';

import { useCanvasGame } from '../useCanvasGame';

const BROWS = 6, BCOLS = 10, BH = 22, BPAD = 4, BTOP = 60;
const BCOLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'];

export function Breakout() {
  const { canvasRef } = useCanvasGame((api) => {
    const { canvas, ctx, setScore } = api;
    let raf = 0;
    let score = 0, lives = 3, over = false, won = false;
    let pw = 100, ph = 14, px = 0;
    let bx = 0, by = 0, br = 7, bdx = 3.5, bdy = -3.5;
    let bricks: boolean[][] = [];

    function initBricks() {
      bricks = Array.from({ length: BROWS }, () => Array(BCOLS).fill(true));
    }

    function resetBall() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      pw = Math.max(80, w * 0.14);
      px = w / 2 - pw / 2;
      bx = w / 2; by = h - 50;
      const angle = (Math.random() * 0.8 + 0.6) * (Math.random() > 0.5 ? 1 : -1);
      bdx = angle; bdy = -3.5;
    }

    function reset() {
      score = 0; lives = 3; over = false; won = false; setScore(0);
      initBricks(); resetBall();
    }

    function update() {
      if (over || won) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const speed = 1 + score * 0.001;

      bx += bdx * speed; by += bdy * speed;

      // Wall bounces
      if (bx - br <= 0) { bx = br; bdx = Math.abs(bdx); }
      if (bx + br >= w) { bx = w - br; bdx = -Math.abs(bdx); }
      if (by - br <= 0) { by = br; bdy = Math.abs(bdy); }

      // Paddle collision
      const paddleTop = h - 35 - ph;
      if (by + br >= paddleTop && by + br <= paddleTop + ph + 8 && bdy > 0) {
        if (bx >= px - br && bx <= px + pw + br) {
          bdy = -Math.abs(bdy);
          const hit = (bx - px) / pw - 0.5; // -0.5 to 0.5
          bdx = hit * 8;
          by = paddleTop - br;
        }
      }

      // Ball below paddle
      if (by - br > h) {
        lives--;
        if (lives <= 0) { over = true; return; }
        resetBall();
      }

      // Brick collisions
      const bw = (w - BPAD * (BCOLS + 1)) / BCOLS;
      for (let r = 0; r < BROWS; r++) {
        for (let c = 0; c < BCOLS; c++) {
          if (!bricks[r][c]) continue;
          const brx = BPAD + c * (bw + BPAD);
          const bry = BTOP + r * (BH + BPAD);
          if (bx + br > brx && bx - br < brx + bw && by + br > bry && by - br < bry + BH) {
            bricks[r][c] = false;
            // Determine bounce direction
            const overlapLeft = bx + br - brx;
            const overlapRight = brx + bw - (bx - br);
            const overlapTop = by + br - bry;
            const overlapBottom = bry + BH - (by - br);
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            if (minOverlap === overlapTop || minOverlap === overlapBottom) bdy = -bdy;
            else bdx = -bdx;
            score += 10; setScore(score);
            if (bricks.every(row => row.every(b => !b))) won = true;
            return;
          }
        }
      }
    }

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const bw = (w - BPAD * (BCOLS + 1)) / BCOLS;

      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);

      // Bricks
      for (let r = 0; r < BROWS; r++) {
        for (let c = 0; c < BCOLS; c++) {
          if (!bricks[r][c]) continue;
          const x = BPAD + c * (bw + BPAD), y = BTOP + r * (BH + BPAD);
          ctx.fillStyle = BCOLORS[r];
          ctx.beginPath();
          ctx.roundRect(x, y, bw, BH, 3);
          ctx.fill();
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(x + 2, y + 2, bw - 4, 4);
        }
      }

      // Paddle
      const paddleTop = h - 35 - ph;
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.roundRect(px, paddleTop, pw, ph, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(px + 4, paddleTop + 2, pw - 8, 3);

      // Ball
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      // Ball glow
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.arc(bx, by, br * 2.5, 0, Math.PI * 2); ctx.fill();

      // HUD
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 12, 30);
      ctx.textAlign = 'right';
      const hearts = '\u2764'.repeat(Math.max(0, lives));
      ctx.fillStyle = '#f87171';
      ctx.fillText(hearts, w - 12, 30);
      ctx.textAlign = 'left';

      // Controls hint
      ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText('R Restart', 12, h - 10);

      // Win/Lose overlay
      if (over || won) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 28px monospace';
        ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', w / 2, h / 2 - 15);
        ctx.font = '15px monospace'; ctx.fillText(`Score: ${score}`, w / 2, h / 2 + 18);
        ctx.fillStyle = '#10b981'; ctx.fillText('Press R to restart', w / 2, h / 2 + 48);
        ctx.textAlign = 'left';
      }
    }

    function loop() { update(); draw(); raf = requestAnimationFrame(loop); }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') { reset(); e.preventDefault(); return; }
      const step = 28;
      if (e.key === 'ArrowLeft') px = Math.max(0, px - step);
      else if (e.key === 'ArrowRight') px = Math.min(canvas.clientWidth - pw, px + step);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
    }

    function onMouse(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      px = Math.max(0, Math.min(canvas.clientWidth - pw, (e.clientX - rect.left) - pw / 2));
    }

    function onTouch(e: TouchEvent) {
      const rect = canvas.getBoundingClientRect();
      px = Math.max(0, Math.min(canvas.clientWidth - pw, (e.touches[0].clientX - rect.left) - pw / 2));
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
