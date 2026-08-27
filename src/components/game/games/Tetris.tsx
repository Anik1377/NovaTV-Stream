'use client';

import { useCanvasGame } from '../useCanvasGame';

const COLS = 10, ROWS = 20;
const DEFS: [string, number[][], string][] = [
  ['I', [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], '#22d3ee'],
  ['O', [[1,1],[1,1]], '#facc15'],
  ['T', [[0,1,0],[1,1,1],[0,0,0]], '#a855f7'],
  ['S', [[0,1,1],[1,1,0],[0,0,0]], '#4ade80'],
  ['Z', [[1,1,0],[0,1,1],[0,0,0]], '#f87171'],
  ['J', [[1,0,0],[1,1,1],[0,0,0]], '#60a5fa'],
  ['L', [[0,0,1],[1,1,1],[0,0,0]], '#fb923c'],
];

function rotate(s: number[][]): number[][] {
  const n = s.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => s[n - 1 - j][i])
  );
}

export function Tetris() {
  const { canvasRef } = useCanvasGame((api) => {
    const { canvas, ctx, setScore } = api;
    let raf = 0, lastTime = 0, dropTimer = 0;
    let grid: (string | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    let piece: number[][] = [], pColor = '', pX = 0, pY = 0, nextIdx = 0;
    let score = 0, linesCleared = 0, level = 1, gameOver = false;

    const rnd = () => Math.floor(Math.random() * DEFS.length);

    function spawn() {
      const i = nextIdx;
      nextIdx = rnd();
      piece = DEFS[i][1].map(r => [...r]);
      pColor = DEFS[i][2];
      pX = Math.floor((COLS - piece[0].length) / 2);
      pY = 0;
      if (hits(piece, pX, pY)) gameOver = true;
    }

    function hits(s: number[][], px: number, py: number) {
      for (let y = 0; y < s.length; y++)
        for (let x = 0; x < s[y].length; x++)
          if (s[y][x]) {
            const gx = px + x, gy = py + y;
            if (gx < 0 || gx >= COLS || gy >= ROWS) return true;
            if (gy >= 0 && grid[gy][gx]) return true;
          }
      return false;
    }

    function lock() {
      for (let y = 0; y < piece.length; y++)
        for (let x = 0; x < piece[y].length; x++)
          if (piece[y][x] && pY + y >= 0) grid[pY + y][pX + x] = pColor;
      let cleared = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (grid[y].every(c => c !== null)) {
          grid.splice(y, 1);
          grid.unshift(Array(COLS).fill(null));
          cleared++; y++;
        }
      }
      if (cleared) {
        score += [0, 100, 300, 500, 800][cleared] * level;
        linesCleared += cleared;
        level = Math.floor(linesCleared / 10) + 1;
        setScore(score);
      }
      spawn();
    }

    function hardDrop() {
      let d = 0;
      while (!hits(piece, pX, pY + 1)) { pY++; d++; }
      score += d * 2; setScore(score); lock();
    }

    function drawCell(x: number, y: number, sz: number, color: string) {
      ctx.fillStyle = color;
      ctx.fillRect(x + 1, y + 1, sz - 2, sz - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 1, y + 1, sz - 2, 3);
      ctx.fillRect(x + 1, y + 1, 3, sz - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + 1, y + sz - 4, sz - 2, 3);
      ctx.fillRect(x + sz - 4, y + 1, 3, sz - 2);
    }

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const cs = Math.min(w * 0.55 / COLS, (h - 40) / ROWS);
      const ox = (w * 0.65 - cs * COLS) / 2, oy = (h - cs * ROWS) / 2;

      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, w, h);

      // Grid border
      ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
      ctx.strokeRect(ox - 1, oy - 1, COLS * cs + 2, ROWS * cs + 2);

      // Grid lines
      ctx.strokeStyle = 'rgba(16,185,129,0.08)'; ctx.lineWidth = 0.5;
      for (let x = 1; x < COLS; x++) {
        ctx.beginPath(); ctx.moveTo(ox + x * cs, oy); ctx.lineTo(ox + x * cs, oy + ROWS * cs); ctx.stroke();
      }
      for (let y = 1; y < ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(ox, oy + y * cs); ctx.lineTo(ox + COLS * cs, oy + y * cs); ctx.stroke();
      }

      // Locked cells
      for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++)
          if (grid[y][x]) drawCell(ox + x * cs, oy + y * cs, cs, grid[y][x]!);

      // Ghost piece (drop preview)
      if (!gameOver) {
        let ghostY = pY;
        while (!hits(piece, pX, ghostY + 1)) ghostY++;
        for (let y = 0; y < piece.length; y++)
          for (let x = 0; x < piece[y].length; x++)
            if (piece[y][x]) {
              ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
              ctx.strokeRect(ox + (pX + x) * cs + 2, oy + (ghostY + y) * cs + 2, cs - 4, cs - 4);
            }
        // Current piece
        for (let y = 0; y < piece.length; y++)
          for (let x = 0; x < piece[y].length; x++)
            if (piece[y][x]) drawCell(ox + (pX + x) * cs, oy + (pY + y) * cs, cs, pColor);
      }

      // Next piece preview
      const nx = ox + COLS * cs + 24, ny = oy + 10;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
      ctx.fillText('NEXT', nx, ny);
      const npc = cs * 0.65;
      const nd = DEFS[nextIdx][1];
      for (let y = 0; y < nd.length; y++)
        for (let x = 0; x < nd[y].length; x++)
          if (nd[y][x]) drawCell(nx + x * npc, ny + 8 + y * npc, npc, DEFS[nextIdx][2]);

      // Info panel
      ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#fff';
      ctx.fillText(`Score: ${score}`, nx, ny + 110);
      ctx.fillText(`Level: ${level}`, nx, ny + 134);
      ctx.fillText(`Lines: ${linesCleared}`, nx, ny + 158);

      // Controls
      ctx.font = '11px monospace'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
      const controls = ['← →  Move', '↑  Rotate', '↓  Soft drop', 'Space  Hard drop', 'R  Restart'];
      controls.forEach((t, i) => ctx.fillText(t, nx, ny + 195 + i * 18));

      // Game over overlay
      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.font = 'bold 28px monospace'; ctx.fillText('GAME OVER', w / 2, h / 2 - 15);
        ctx.font = '15px monospace'; ctx.fillText(`Final Score: ${score}`, w / 2, h / 2 + 18);
        ctx.fillStyle = '#10b981'; ctx.fillText('Press R to restart', w / 2, h / 2 + 48);
        ctx.textAlign = 'left';
      }
    }

    function loop(t: number) {
      const dt = lastTime ? t - lastTime : 16;
      lastTime = t;
      if (!gameOver) {
        dropTimer += dt;
        if (dropTimer >= Math.max(80, 800 - (level - 1) * 70)) {
          dropTimer = 0;
          if (!hits(piece, pX, pY + 1)) pY++; else lock();
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') {
        grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
        score = 0; linesCleared = 0; level = 1; gameOver = false; dropTimer = 0; setScore(0);
        nextIdx = rnd(); spawn(); return;
      }
      if (gameOver) return;
      if (e.key === 'ArrowLeft' && !hits(piece, pX - 1, pY)) pX--;
      else if (e.key === 'ArrowRight' && !hits(piece, pX + 1, pY)) pX++;
      else if (e.key === 'ArrowDown' && !hits(piece, pX, pY + 1)) { pY++; score++; setScore(score); }
      else if (e.key === 'ArrowUp') { const r = rotate(piece); if (!hits(r, pX, pY)) piece = r; }
      else if (e.key === ' ') hardDrop();
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();
    }

    nextIdx = rnd();
    spawn();
    window.addEventListener('keydown', onKey);
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); };
  });

  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
