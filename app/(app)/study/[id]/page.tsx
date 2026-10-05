import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import StudyContent from './_components/study-content';

export const dynamic = 'force-dynamic';

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { id } = await params;

  const studyUnit = await prisma.studyUnit.findFirst({
    where: { id, userId: session.user.id },
    include: {
      subject: true,
      questions: { orderBy: { createdAt: 'asc' } },
      quizResults: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!studyUnit) redirect('/dashboard');

  return <StudyContent studyUnit={JSON.parse(JSON.stringify(studyUnit))} />;
}
