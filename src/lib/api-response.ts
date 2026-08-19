import { NextResponse } from 'next/server';

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function err(message: string, status = 500) {
  // In production, don't leak internal error details
  const msg = status >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : message;
  return NextResponse.json({ error: msg }, { status });
}

export function badRequest(message = 'Invalid request') {
  return err(message, 400);
}

export function unauthorized(message = 'Authentication required') {
  return err(message, 401);
}

export function notFound(message = 'Not found') {
  return err(message, 404);
}
