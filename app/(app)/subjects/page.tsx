import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import SubjectsContent from './_components/subjects-content';

export const dynamic = 'force-dynamic';

export default async function SubjectsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const subjects = await prisma.subject.findMany({
    where: { userId },
    include: { _count: { select: { studyUnits: true } }, studyUnits: { orderBy: { createdAt: 'desc' }, take: 3, select: { id: true, title: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return <SubjectsContent subjects={JSON.parse(JSON.stringify(subjects))} />;
}
