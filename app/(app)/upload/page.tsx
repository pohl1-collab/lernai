import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import UploadContent from './_components/upload-content';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const subjects = await prisma.subject.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
  return <UploadContent subjects={JSON.parse(JSON.stringify(subjects))} />;
}
