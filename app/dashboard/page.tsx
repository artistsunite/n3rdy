import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import OverviewPanel from '@/components/dashboard/OverviewPanel';

export const metadata = { title: 'N3RDY Intelligence — Overview' };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <OverviewPanel userName={session.user.name} />
    </DashboardShell>
  );
}
