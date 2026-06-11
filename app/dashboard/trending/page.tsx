import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import TrendingPanel from '@/components/dashboard/TrendingPanel';

export const metadata = { title: 'N3RDY Intelligence — Trending' };

export default async function TrendingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <TrendingPanel />
    </DashboardShell>
  );
}
