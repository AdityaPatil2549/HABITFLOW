import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — HabitFlow';
  }, []);

  return (
    <div className="min-h-[100dvh] px-6 py-12 max-w-3xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 active:scale-[0.98]"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <Shield size={20} className="text-emerald-400" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Privacy Policy</h1>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300 leading-relaxed">
        <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">1. Data We Collect</h2>
          <p>HabitFlow is designed as a <strong>local-first application</strong>. Your habit data, tasks, mood entries, and settings are stored locally on your device using IndexedDB. We do not collect, transmit, or sell your personal data unless you explicitly opt into cloud sync.</p>
          <p>If you create an account, we store your email address and authentication token via Supabase to enable cloud backup and cross-device sync.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">2. Where Data Is Stored</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Local data:</strong> Stored in your browser's IndexedDB. Never leaves your device.</li>
            <li><strong>Cloud sync (optional):</strong> Stored in Supabase (hosted on AWS infrastructure). Data is encrypted in transit via TLS.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">3. Third-Party Services</h2>
          <p>When cloud sync is enabled, we use Supabase for authentication and data storage. No data is shared with advertisers or third-party analytics providers.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">4. Your Rights (GDPR / CCPA)</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Access all data stored about you</li>
            <li>Request deletion of your account and all associated data</li>
            <li>Export your data at any time via the Settings page</li>
            <li>Withdraw consent for cloud sync (data remains local)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">5. Cookies</h2>
          <p>HabitFlow does not use tracking cookies. Authentication tokens are stored in your browser's local storage for session management only.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">6. Contact</h2>
          <p>If you have questions about this privacy policy, please reach out via the Settings page or email us at privacy@habitflow.app.</p>
        </section>
      </div>
    </div>
  );
}

export default PrivacyPage;
