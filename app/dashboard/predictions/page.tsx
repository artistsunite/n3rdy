import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import PredictionsPanel from '@/components/dashboard/PredictionsPanel';

export const metadata = { title: 'Predictions — N3RDY Intelligence' };

export default async function PredictionsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <PredictionsPanel />
    </DashboardShell>
  );
}
