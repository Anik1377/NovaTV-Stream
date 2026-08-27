'use client';

import { useRef, useEffect, useCallback, useState } from 'react';

export interface CanvasGameAPI {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  setScore: (s: number) => void;
  getScore: () => number;
  isRunning: boolean;
}

export function useCanvasGame(
  init: (api: CanvasGameAPI) => () => void,
  deps: unknown[] = []
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef(0);
  const runningRef = useRef(true);
  const [score, setScoreState] = useState(0);

  const setScore = useCallback((s: number) => {
    scoreRef.current = s;
    setScoreState(s);
  }, []);

  const getScore = useCallback(() => scoreRef.current, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to parent
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    runningRef.current = true;
    const cleanup = init({
      canvas,
      ctx,
      width: canvas.width,
      height: canvas.height,
      setScore,
      getScore,
      isRunning: true,
    });

    window.addEventListener('resize', resize);
    return () => {
      runningRef.current = false;
      cleanup?.();
      window.removeEventListener('resize', resize);
    };
  }, deps);

  return { canvasRef, score };
}
