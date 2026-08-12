import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('sv_session')?.value;
    if (token) {
      await db.session.deleteMany({ where: { token } });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set('sv_session', '', { maxAge: 0, path: '/' });
    return res;
  } catch {
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
