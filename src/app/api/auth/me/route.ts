import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('sv_session')?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await db.session.delete({ where: { id: session.id } });
      }
      const res = NextResponse.json({ user: null });
      res.cookies.set('sv_session', '', { maxAge: 0, path: '/' });
      return res;
    }

    return NextResponse.json({
      user: { id: session.user.id, email: session.user.email, name: session.user.name },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
