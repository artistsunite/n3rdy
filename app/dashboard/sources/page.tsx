import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SourceManager from '@/components/dashboard/SourceManager';

export const metadata = { title: 'N3RDY Intelligence — Sources' };

export default async function SourcesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <SourceManager />
    </DashboardShell>
  );
}
