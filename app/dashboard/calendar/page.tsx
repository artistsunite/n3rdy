import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import EconomicCalendar from '@/components/dashboard/EconomicCalendar';

export const metadata = { title: 'N3RDY Intelligence — Calendar' };

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <EconomicCalendar />
    </DashboardShell>
  );
}
