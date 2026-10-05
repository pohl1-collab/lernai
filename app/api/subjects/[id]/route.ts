export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  const { id } = await params;
  const subject = await prisma.subject.findFirst({ where: { id, userId: session.user.id } });
  if (!subject) return NextResponse.json({ error: 'Fach nicht gefunden' }, { status: 404 });
  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const subject = await prisma.subject.findFirst({ where: { id, userId: session.user.id } });
  if (!subject) return NextResponse.json({ error: 'Fach nicht gefunden' }, { status: 404 });
  const updated = await prisma.subject.update({
    where: { id },
    data: {
      ...(body?.name ? { name: body.name } : {}),
      ...(body?.color ? { color: body.color } : {}),
      ...(body?.icon ? { icon: body.icon } : {}),
    },
  });
  return NextResponse.json(updated);
}
