import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import AdvisorPanel from '@/components/dashboard/AdvisorPanel';

export const metadata = { title: 'N3RDY Intelligence — AI Advisor' };

export default async function AdvisorPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <AdvisorPanel />
    </DashboardShell>
  );
}
