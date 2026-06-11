import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';

export const metadata = { title: 'N3RDY Intelligence — Settings' };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <DashboardShell userName={session.user.name} userImage={session.user.image}>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-n3-text">Settings</h1>
          <p className="text-n3-muted text-sm mt-1">Manage your account and preferences</p>
        </div>
        <div className="bg-n3-card border border-n3-border rounded-xl p-5">
          <div className="text-sm font-semibold text-n3-text mb-3">Account</div>
          <div className="flex items-center gap-3">
            {session.user.image && (
              <img src={session.user.image} alt="avatar" className="w-10 h-10 rounded-full" />
            )}
            <div>
              <div className="text-sm text-n3-text font-medium">{session.user.name}</div>
              <div className="text-xs text-n3-muted">{session.user.email}</div>
            </div>
          </div>
        </div>
        <div className="bg-n3-card border border-dashed border-n3-border rounded-xl p-8 text-center">
          <p className="text-n3-muted text-sm">Full preference settings — briefing frequency, business profile, notification channels — coming soon.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
