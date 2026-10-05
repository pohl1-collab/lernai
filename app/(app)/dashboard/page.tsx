import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import DashboardContent from './_components/dashboard-content';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';

  const [subjects, recentUnits, quizResults] = await Promise.all([
    prisma.subject.findMany({
      where: { userId },
      include: { _count: { select: { studyUnits: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.studyUnit.findMany({
      where: { userId },
      include: { subject: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.quizResult.findMany({
      where: { userId },
      include: { studyUnit: { include: { subject: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return (
    <DashboardContent
      userName={session?.user?.name ?? ''}
      subjects={JSON.parse(JSON.stringify(subjects))}
      recentUnits={JSON.parse(JSON.stringify(recentUnits))}
      quizResults={JSON.parse(JSON.stringify(quizResults))}
    />
  );
}
