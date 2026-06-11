import Link from 'next/link';
import { Activity } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — N3RDY',
  description: 'Terms of Service for N3RDY Market Intelligence',
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-white/40 text-sm mb-12">Last updated: June 11, 2026</p>

        <div className="space-y-8 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using N3RDY at n3rdy.info (the "Service"), you agree to be bound by these
              Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              We reserve the right to update these Terms at any time; continued use of the Service
              constitutes acceptance of any changes.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">2. Description of Service</h2>
            <p>
              N3RDY is an AI-powered market intelligence platform that aggregates publicly available
              financial news, economic data, and market signals, and delivers synthesised briefings
              powered by Claude Fable 5 (Anthropic). The Service is provided for informational purposes
              only and does not constitute financial advice, investment advice, trading advice, or any
              other type of professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">3. Not Financial Advice</h2>
            <p className="mb-3">
              <strong className="text-white/90">All content provided by N3RDY is for informational and
              educational purposes only.</strong> Nothing on this Service should be construed as:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>A recommendation to buy, sell, or hold any security, asset, or financial instrument</li>
              <li>Investment or financial advice of any kind</li>
              <li>A guarantee of future performance or outcomes</li>
              <li>A solicitation to engage in any investment activity</li>
            </ul>
            <p className="mt-3">
              Always conduct your own research and consult a qualified financial advisor before making
              any investment decision. Past performance is not indicative of future results.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">4. Eligibility</h2>
            <p>
              You must be at least 18 years of age to use the Service. By using N3RDY, you represent
              and warrant that you meet this requirement and have the legal capacity to enter into
              these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">5. User Accounts</h2>
            <p>
              Access to certain features of the Service requires authentication via Google OAuth.
              You are responsible for maintaining the security of your Google account and for all
              activity that occurs under your account. You agree to notify us immediately of any
              unauthorised access at{' '}
              <a href="mailto:support@n3rdy.info" className="text-white underline underline-offset-2">
                support@n3rdy.info
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">6. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
              <li>Attempt to gain unauthorised access to any part of the Service or its infrastructure</li>
              <li>Scrape, crawl, or systematically extract data from the Service without permission</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Transmit any malware, viruses, or other harmful code</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Resell or redistribute the Service's content without written permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">7. Intellectual Property</h2>
            <p>
              All content, design, code, trademarks, and materials on the Service are the property of
              N3RDY or its licensors and are protected by applicable intellectual property laws.
              You may not reproduce, distribute, modify, or create derivative works without our
              express written consent. AI-generated briefings delivered through the Service are
              provided for your personal, non-commercial use only.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">8. Third-Party Content and Links</h2>
            <p>
              The Service aggregates and summarises content from third-party sources. We do not
              endorse, guarantee the accuracy of, or take responsibility for any third-party content.
              Any links to external sites are provided for convenience; we are not responsible for
              the content or practices of those sites.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, OR NON-INFRINGEMENT. WE DO NOT WARRANT
              THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, N3RDY AND ITS OPERATORS SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
              BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR
              INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU, IF ANY, FOR ACCESS TO
              THE SERVICE IN THE TWELVE MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless N3RDY and its operators from any claims,
              losses, damages, liabilities, costs, or expenses (including legal fees) arising from
              your use of the Service, your violation of these Terms, or your violation of any
              third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">12. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time,
              with or without notice, for any reason including violation of these Terms. Upon
              termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable law.
              Any disputes arising under these Terms shall be subject to the exclusive jurisdiction
              of the courts in the applicable jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">14. Changes to These Terms</h2>
            <p>
              We may revise these Terms at any time. We will indicate the date of the most recent
              update at the top of this page. Your continued use of the Service after any changes
              constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-white text-lg font-semibold mb-3">15. Contact</h2>
            <p>For questions about these Terms, contact us at:</p>
            <div className="mt-3 p-4 border border-white/10 rounded-xl text-sm">
              <p>N3RDY Market Intelligence</p>
              <p>
                Email:{' '}
                <a href="mailto:legal@n3rdy.info" className="text-white underline underline-offset-2">
                  legal@n3rdy.info
                </a>
              </p>
              <p>Website: n3rdy.info</p>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-white/20 text-xs">
        © 2026 N3RDY Market Intelligence ·{' '}
        <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>
        {' '}·{' '}
        <Link href="/terms" className="hover:text-white/40 transition-colors">Terms of Service</Link>
      </footer>
    </div>
  );
}
