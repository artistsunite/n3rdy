import Link from 'next/link';
import { Activity } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — N3RDY',
  description: 'Privacy Policy for N3RDY Market Intelligence',
};

export default function PrivacyPage() {
  return (
    <div className="bg-black min-h-screen text-white">
      {/* Minimal nav */}
      <nav className="px-6 py-6 border-b border-white/5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Activity size={18} className="text-white" />
            <span className="font-semibold tracking-wide">N3RDY</span>
          </Link>
          <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <p className="text-white/40 text-xs tracking-widest uppercase mb-4">Legal</p>
        <h1
          className="text-4xl md:text-5xl text-white mb-4 tracking-tight"
          style={{ fontFamily: '"Instrument Serif", serif' }}
        >
          Privacy Policy
        </h1>
        <p className="text-white/40 text-sm mb-12">Last updated: June 11, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">1. Introduction</h2>
            <p>
              N3RDY ("we", "us", or "our") operates the website at n3rdy.info (the "Service"). This Privacy Policy
              explains how we collect, use, and protect your personal information when you use our Service.
              By accessing or using N3RDY, you agree to the collection and use of information in accordance with
              this policy.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect the following types of information:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-white/90">Account information</strong> — When you sign in with Google,
                we receive your name, email address, and profile picture from Google's OAuth service.
              </li>
              <li>
                <strong className="text-white/90">Usage data</strong> — We collect anonymised analytics data
                including pages visited, time on site, and general device/browser information via Firebase Analytics.
              </li>
              <li>
                <strong className="text-white/90">Email address</strong> — If you submit your email via our
                subscription form, we store it to send you market briefings and service updates.
              </li>
              <li>
                <strong className="text-white/90">Push notification tokens</strong> — If you enable push
                notifications, we store a device token via Firebase Cloud Messaging to deliver alerts.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="mb-3">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Provide and operate the N3RDY Service</li>
              <li>Authenticate your identity and maintain your session</li>
              <li>Deliver market intelligence briefings and notifications</li>
              <li>Improve and personalise the Service based on usage patterns</li>
              <li>Communicate service updates, security notices, and support messages</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services that may process your data:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-white/90">Google OAuth</strong> — for authentication.
                Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2">Google's Privacy Policy</a>.
              </li>
              <li>
                <strong className="text-white/90">Firebase (Google)</strong> — for hosting, analytics, and
                push notifications. Subject to <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2">Firebase's Privacy Policy</a>.
              </li>
              <li>
                <strong className="text-white/90">Anthropic Claude</strong> — our AI engine processes
                publicly available market data to generate briefings. No personal user data is sent to Anthropic.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">5. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. Analytics data is
              retained in aggregate, anonymised form. If you request deletion of your account, we will remove
              your personal data within 30 days, except where we are required to retain it by law.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">6. Cookies</h2>
            <p>
              We use session cookies to maintain your authenticated state. These are strictly necessary for
              the Service to function and do not track you across other websites. We do not use advertising
              or third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your personal data</li>
              <li>Withdraw consent for data processing at any time</li>
              <li>Lodge a complaint with your local data protection authority</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@n3rdy.info" className="text-white underline underline-offset-2">
                privacy@n3rdy.info
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">8. Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption, secure session
              management, and restricted access to personal data. Authentication secrets are stored in
              Google Cloud Secret Manager and never exposed in code or logs.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">9. Children's Privacy</h2>
            <p>
              N3RDY is not directed at individuals under the age of 16. We do not knowingly collect personal
              information from children. If you believe a child has provided us with personal data, please
              contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              by updating the "Last updated" date at the top of this page. Continued use of the Service
              after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">11. Contact</h2>
            <p>
              For any questions about this Privacy Policy or how we handle your data, contact us at:
            </p>
            <div className="mt-3 p-4 border border-white/10 rounded-xl text-sm">
              <p>N3RDY Market Intelligence</p>
              <p>
                Email:{' '}
                <a href="mailto:privacy@n3rdy.info" className="text-white underline underline-offset-2">
                  privacy@n3rdy.info
                </a>
              </p>
              <p>Website: n3rdy.info</p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-white/20 text-xs">
        © 2026 N3RDY Market Intelligence · <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
      </footer>
    </div>
  );
}
