import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const metadata = {
  title: 'N3RDY Dashboard — Operator Control',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <DashboardClient
      user={{
        name: session.user.name ?? 'Operator',
        email: session.user.email ?? '',
        image: session.user.image ?? null,
      }}
    />
  );
}
