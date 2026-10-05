export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
const body = contentType.includes('application/json')
  ? await request.json()
  : Object.fromEntries((await request.formData()).entries());
    const { email, password, name } = body ?? {};
    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Diese E-Mail ist bereits registriert' }, { status: 409 });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, hashedPassword, name: name ?? '' },
    });
    return NextResponse.redirect(new URL('/login?registered=1', request.url), 303););
    } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 });
  }
}
