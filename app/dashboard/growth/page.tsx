import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import GrowthPanel from '@/components/dashboard/GrowthPanel';

export const metadata = { title: 'N3RDY Intelligence — Growth' };

export default async function GrowthPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <GrowthPanel />
    </DashboardShell>
  );
}
