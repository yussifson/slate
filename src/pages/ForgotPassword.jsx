import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { powerSync } from "@/api/PowerSyncConnector";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getSubdomainAndBase } from '@/lib/domainUtils';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

function Logo({ className }) {
  return (
    <div className={`rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg ${className}`}>
      O
    </div>
  );
}

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const { currentSubdomain, baseDomain } = getSubdomainAndBase();
  const port = window.location.port ? `:${window.location.port}` : '';
  const base = currentSubdomain
    ? `${window.location.protocol}//${currentSubdomain}.${baseDomain}${port}`
    : `${window.location.protocol}//${baseDomain}${port}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${base}/reset-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-800/50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900/40 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-10 space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center mb-2">
              <Logo className="w-12 h-12" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">by Optavel</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t("reset_your_password", "Reset your password")}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              {sent
                ? 'Check your email for a password reset link.'
                : "Enter your email address and we'll send you a secure reset link."}
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-slate-600 text-center">
                {t("we_sent_a_reset_link_to", "We sent a reset link to")} <span className="font-semibold text-slate-900 dark:text-slate-100">{email}</span>.
                                <br />{t("check_your_inbox_and_spam_fold", "Check your inbox (and spam folder).")}
              </p>
              <a href="/login" className="text-sm font-bold text-primary hover:underline flex items-center gap-1 mt-2">
                <ArrowLeft className="w-4 h-4" /> {t("back_to_login", "Back to login")}
              </a>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 font-medium">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  {t("email_address", "Email Address")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 rounded-xl border-slate-200 bg-slate-50/50 dark:bg-transparent focus:bg-white dark:bg-slate-900/40 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium pl-11 pr-4 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-white transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-600/20"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>

              <div className="text-center">
                <a href="/login" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" /> {t("back_to_login", "Back to login")}
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
