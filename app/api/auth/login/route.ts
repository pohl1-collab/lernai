export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};
    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort erforderlich' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.hashedPassword);
    if (!valid) {
      return NextResponse.json({ error: 'Ungültige Anmeldedaten' }, { status: 401 });
    }
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen' }, { status: 500 });
  }
}
