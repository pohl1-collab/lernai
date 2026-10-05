export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  try {
    const body = await request.json();
    const { studyUnitId, score, total } = body ?? {};
    if (!studyUnitId || score === undefined || !total) {
      return NextResponse.json({ error: 'studyUnitId, score und total erforderlich' }, { status: 400 });
    }
    // Verify ownership
    const unit = await prisma.studyUnit.findFirst({ where: { id: studyUnitId, userId: session.user.id } });
    if (!unit) return NextResponse.json({ error: 'Lerneinheit nicht gefunden' }, { status: 404 });
    const result = await prisma.quizResult.create({
      data: {
        userId: session.user.id,
        studyUnitId,
        score: Number(score),
        total: Number(total),
      },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Quiz result error:', error);
    return NextResponse.json({ error: 'Ergebnis konnte nicht gespeichert werden' }, { status: 500 });
  }
}
