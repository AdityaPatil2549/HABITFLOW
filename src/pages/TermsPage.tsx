import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service — HabitFlow';
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
          <FileText size={20} className="text-emerald-400" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Terms of Service</h1>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-6 text-slate-300 leading-relaxed">
        <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>By using HabitFlow, you agree to these terms. If you do not agree, please do not use the application.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">2. Description of Service</h2>
          <p>HabitFlow is a personal habit tracking and productivity application. It provides tools for habit management, task tracking, mood logging, analytics, and gamified progress visualization. The service is provided "as is" without warranty of any kind.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">3. User Accounts</h2>
          <p>Account creation is optional. Creating an account enables cloud backup and cross-device sync. You are responsible for maintaining the confidentiality of your login credentials.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">4. User Data</h2>
          <p>You retain full ownership of all data you create within HabitFlow. We do not claim any intellectual property rights over your habits, tasks, mood entries, or any other user-generated content.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">5. Acceptable Use</h2>
          <p>You agree not to misuse the service, including but not limited to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Attempting to gain unauthorized access to the service or its systems</li>
            <li>Using automated means to access the service beyond normal use</li>
            <li>Interfering with other users' access to the service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">6. Limitation of Liability</h2>
          <p>HabitFlow and its creators shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mt-8 mb-3">8. Contact</h2>
          <p>For questions regarding these terms, please contact us via the Settings page or email us at legal@habitflow.app.</p>
        </section>
      </div>
    </div>
  );
}

export default TermsPage;
