'use client';

import { useCanvasGame, type CanvasGameAPI } from '../useCanvasGame';

const GRAVITY = 0.42;
const FLAP = -6.8;
const PIPE_W = 52;
const GAP = 140;
const SPEED = 2.5;
const BIRD_R = 12;
const BIRD_X = 60;

export function FlappyBird() {
  const { canvasRef, score } = useCanvasGame((api: CanvasGameAPI) => {
    const { canvas, ctx } = api;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    type Pipe = { x: number; gapY: number; scored: boolean };
    let birdY = H / 2;
    let vel = 0;
    let pipes: Pipe[] = [];
    let dead = false;
    let started = false;
    let rafId = 0;
    let spawnTimer = 0;

    function reset() {
      birdY = H / 2; vel = 0; pipes = []; dead = false;
      started = false; spawnTimer = 0; api.setScore(0);
    }

    function flap() {
      if (dead) { reset(); return; }
      if (!started) started = true;
      vel = FLAP;
    }

    function update() {
      if (dead || !started) return;
      vel += GRAVITY;
      birdY += vel;

      // Spawn pipes
      spawnTimer++;
      if (spawnTimer > 95) {
        spawnTimer = 0;
        const minGap = 60;
        const gapY = minGap + Math.random() * (H - GAP - minGap * 2);
        pipes.push({ x: W + 10, gapY, scored: false });
      }

      // Move & score pipes
      for (const p of pipes) {
        p.x -= SPEED;
        if (!p.scored && p.x + PIPE_W < BIRD_X) {
          p.scored = true;
          api.setScore(api.getScore() + 1);
        }
      }
      pipes = pipes.filter(p => p.x + PIPE_W > -20);

      // Collision: ceiling / ground
      if (birdY - BIRD_R < 0 || birdY + BIRD_R > H) { dead = true; return; }

      // Collision: pipes
      for (const p of pipes) {
        if (BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W) {
          if (birdY - BIRD_R < p.gapY || birdY + BIRD_R > p.gapY + GAP) {
            dead = true; return;
          }
        }
      }
    }

    function draw() {
      // Background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      // Ground line
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H - 1); ctx.lineTo(W, H - 1); ctx.stroke();

      // Pipes
      for (const p of pipes) {
        // Top pipe body
        ctx.fillStyle = '#14532d';
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        // Bottom pipe body
        ctx.fillRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP);
        // Caps
        const capH = 14;
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x - 4, p.gapY - capH, PIPE_W + 8, capH);
        ctx.fillRect(p.x - 4, p.gapY + GAP, PIPE_W + 8, capH);
        // Highlight edge
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(p.x, 0, 3, p.gapY - capH);
        ctx.fillRect(p.x, p.gapY + GAP + capH, 3, H);
      }

      // Bird
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(BIRD_X, birdY, BIRD_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Wing
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.ellipse(BIRD_X - 5, birdY + 2, 7, 4, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(BIRD_X + 4, birdY - 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a0a0a';
      ctx.beginPath(); ctx.arc(BIRD_X + 5, birdY - 3, 1.5, 0, Math.PI * 2); ctx.fill();

      // Score — prominent
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 4;
      ctx.fillText(String(api.getScore()), W / 2, 52);
      ctx.shadowBlur = 0;

      // Start prompt
      if (!started && !dead) {
        ctx.font = '16px system-ui, sans-serif';
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('Press Space or Click to start', W / 2, H / 2 + 60);
      }

      // Game over
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
        ctx.fillText('Press R or Click to restart', W / 2, H / 2 + 52);
      }
    }

    function loop() {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') { e.preventDefault(); flap(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    const onClick = () => { if (dead) reset(); else flap(); };
    const onTouch = (e: TouchEvent) => { e.preventDefault(); if (dead) reset(); else flap(); };

    window.addEventListener('keydown', onKey);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouch);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
