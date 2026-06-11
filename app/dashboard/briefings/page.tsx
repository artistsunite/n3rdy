import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BriefingsPanel from '@/components/dashboard/BriefingsPanel';

export const metadata = { title: 'N3RDY Intelligence — Briefings' };

export default async function BriefingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <BriefingsPanel />
    </DashboardShell>
  );
}
