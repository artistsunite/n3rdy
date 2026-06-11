import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import WatchlistPanel from '@/components/dashboard/WatchlistPanel';

export const metadata = { title: 'N3RDY Intelligence — Watchlist' };

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <WatchlistPanel />
    </DashboardShell>
  );
}
