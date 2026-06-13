import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import CompetitorPanel from '@/components/dashboard/CompetitorPanel';

export const metadata = { title: 'N3RDY Intelligence — Competitors' };

export default async function CompetitorsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <CompetitorPanel />
    </DashboardShell>
  );
}
