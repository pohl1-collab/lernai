export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  const subjects = await prisma.subject.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { studyUnits: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(subjects);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  try {
    const body = await request.json();
    const { name, color, icon } = body ?? {};
    if (!name?.trim()) return NextResponse.json({ error: 'Name erforderlich' }, { status: 400 });
    const subject = await prisma.subject.create({
      data: {
        name: name.trim(),
        color: color ?? '#3b82f6',
        icon: icon ?? 'book',
        userId: session.user.id,
      },
    });
    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    console.error('Create subject error:', error);
    return NextResponse.json({ error: 'Fach konnte nicht erstellt werden' }, { status: 500 });
  }
}
