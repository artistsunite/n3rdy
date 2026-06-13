import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import SettingsClient from './SettingsClient';

export const metadata = { title: 'N3RDY Intelligence — Settings' };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <SettingsClient
        userName={session.user.name}
        userEmail={session.user.email}
        userImage={session.user.image}
      />
    </DashboardShell>
  );
}
