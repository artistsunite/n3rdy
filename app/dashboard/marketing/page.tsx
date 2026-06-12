import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import MarketingPanel from '@/components/dashboard/MarketingPanel';

export const metadata = { title: 'Marketing — N3RDY Intelligence' };

export default async function MarketingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <MarketingPanel />
    </DashboardShell>
  );
}
