'use client';

import { useCanvasGame, type CanvasGameAPI } from '../useCanvasGame';

const ROWS = 5;
const COLS = 10;
const P_SPEED = 4;
const B_SPEED = 6;
const AB_SPEED = 2.8;

export function SpaceInvaders() {
  const { canvasRef, score } = useCanvasGame((api: CanvasGameAPI) => {
    const { canvas, ctx } = api;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    type Alien = { x: number; y: number; hp: number; alive: boolean };
    type Bullet = { x: number; y: number; dy: number };

    let aliens: Alien[] = [];
    let px = W / 2;
    let bullets: Bullet[] = [];
    let abullets: Bullet[] = [];
    let lives = 3;
    let dead = false;
    let rafId = 0;
    let aDir = 1;
    let moveAcc = 0;
    let lastShot = 0;
    const keys = new Set<string>();

    function spawnAliens() {
      aliens = [];
      const gapX = Math.min(40, (W - 80) / COLS);
      const startX = (W - gapX * (COLS - 1)) / 2;
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          aliens.push({ x: startX + c * gapX, y: 50 + r * 32, hp: r < 2 ? 3 : r < 4 ? 2 : 1, alive: true });
    }
    function reset() {
      spawnAliens(); px = W / 2; bullets = []; abullets = [];
      lives = 3; dead = false; aDir = 1; moveAcc = 0; api.setScore(0);
    }
    function shoot() {
      if (dead) return;
      const now = performance.now();
      if (now - lastShot < 280) return;
      lastShot = now;
      bullets.push({ x: px, y: H - 50, dy: -B_SPEED });
    }
    function update() {
      if (dead) return;
      if (keys.has('ArrowLeft') || keys.has('a')) px -= P_SPEED;
      if (keys.has('ArrowRight') || keys.has('d')) px += P_SPEED;
      px = Math.max(18, Math.min(W - 18, px));

      // Alien movement
      const alive = aliens.filter(a => a.alive);
      if (alive.length === 0) return;
      const speed = Math.max(0.4, 0.8 + (COLS * ROWS - alive.length) * 0.06);
      moveAcc += speed;
      if (moveAcc >= 1) {
        moveAcc -= 1;
        let edge = false;
        for (const a of alive)
          if ((a.x > W - 24 && aDir > 0) || (a.x < 24 && aDir < 0)) { edge = true; break; }
        if (edge) {
          aDir *= -1;
          for (const a of alive) a.y += 14;
        } else {
          for (const a of alive) a.x += aDir * 6;
        }
      }

      // Bottom check
      for (const a of alive) if (a.y > H - 70) { dead = true; return; }

      bullets = bullets.filter(b => { b.y += b.dy; return b.y > -10; });
      abullets = abullets.filter(b => { b.y += b.dy; return b.y < H + 10; });

      // Bullet-alien hits
      for (const b of bullets) {
        for (const a of alive) {
          if (b.x > a.x - 12 && b.x < a.x + 12 && b.y > a.y - 10 && b.y < a.y + 10) {
            a.hp--; b.dy = 0;
            if (a.hp <= 0) { a.alive = false; api.setScore(api.getScore() + 10); }
            break;
          }
        }
      }
      bullets = bullets.filter(b => b.dy !== 0);

      // Alien shooting
      if (alive.length > 0 && Math.random() < 0.018) {
        const s = alive[Math.floor(Math.random() * alive.length)];
        abullets.push({ x: s.x, y: s.y + 12, dy: AB_SPEED });
      }

      // Alien bullet hit
      for (const b of abullets) {
        if (b.x > px - 14 && b.x < px + 14 && b.y > H - 52 && b.y < H - 32) {
          lives--; b.dy = 0;
          if (lives <= 0) { dead = true; return; }
        }
      }
      abullets = abullets.filter(b => b.dy !== 0);
    }
    function draw() {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      // Aliens
      const hpColors = ['#ef4444', '#f97316', '#22c55e'];
      for (const a of aliens) {
        if (!a.alive) continue;
        ctx.fillStyle = hpColors[Math.min(a.hp - 1, 2)];
        ctx.fillRect(a.x - 10, a.y - 8, 20, 16);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(a.x - 6, a.y - 4, 4, 4);
        ctx.fillRect(a.x + 2, a.y - 4, 4, 4);
        ctx.fillStyle = hpColors[Math.min(a.hp - 1, 2)];
        ctx.fillRect(a.x - 8, a.y + 8, 4, 4);
        ctx.fillRect(a.x + 4, a.y + 8, 4, 4);
      }

      // Player
      ctx.shadowColor = '#34d399'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#34d399';
      ctx.beginPath(); ctx.moveTo(px, H - 54); ctx.lineTo(px - 16, H - 34); ctx.lineTo(px + 16, H - 34); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#059669';
      ctx.fillRect(px - 18, H - 34, 36, 4);

      // Bullets
      ctx.fillStyle = '#ffffff';
      for (const b of bullets) ctx.fillRect(b.x - 2, b.y, 4, 10);
      ctx.fillStyle = '#ef4444';
      for (const b of abullets) ctx.fillRect(b.x - 2, b.y, 4, 8);

      // HUD
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${api.getScore()}`, 12, 24);
      ctx.textAlign = 'right';
      // Lives
      for (let i = 0; i < lives; i++) {
        const lx = W - 16 - i * 24;
        const ly = 20;
        ctx.fillStyle = '#34d399';
        ctx.beginPath(); ctx.moveTo(lx, ly - 6); ctx.lineTo(lx - 5, ly + 4); ctx.lineTo(lx + 5, ly + 4); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'right';
      ctx.fillText('Lives:', W - 16 - lives * 24, 24);

      // Game over
      if (dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H);
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
    function loop() {
      update(); draw();
      rafId = requestAnimationFrame(loop);
    }
    const onKeyDown = (e: KeyboardEvent) => {
      keys.add(e.key);
      if (e.key === ' ') { e.preventDefault(); shoot(); }
      if (e.key === 'r' || e.key === 'R') reset();
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    spawnAliens();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <div className="w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
