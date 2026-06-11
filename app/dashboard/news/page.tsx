import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NewsFeed from '@/components/dashboard/NewsFeed';

export const metadata = { title: 'N3RDY Intelligence — News Feed' };

export default async function NewsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <NewsFeed />
    </DashboardShell>
  );
}
