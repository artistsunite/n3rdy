import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import BusinessProfilePanel from '@/components/dashboard/BusinessProfilePanel';

export const metadata = { title: 'N3RDY Intelligence — Business Profile' };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <BusinessProfilePanel />
    </DashboardShell>
  );
}
