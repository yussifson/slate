import { useTranslation } from "react-i18next";
import { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';

function Logo({ className }) {
  return (
    <div className={`rounded-xl bg-primary flex items-center justify-center text-white font-black text-lg ${className}`}>
      O
    </div>
  );
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // Supabase sends tokens as URL hash fragments; we need to set the session from them
  useEffect(() => {
    supabase.auth.getSession(); // trigger session loading from hash
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-800/50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900/40 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-10 space-y-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center mb-2">
              <Logo className="w-12 h-12" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">by Optavel</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t("set_new_password", "Set new password")}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {done ? 'Password updated! Redirecting to login...' : 'Choose a strong password for your account.'}
            </p>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-slate-600 text-center">
                {t(
                  "your_password_has_been_updated",
                  "Your password has been updated successfully!"
                )}
                <br />{t(
                  "you_will_be_redirected_to_logi",
                  "You will be redirected to login shortly."
                )}
              </p>
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
                  {t("new_password", "New Password")}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 rounded-xl border-slate-200 bg-slate-50/50 dark:bg-transparent focus:bg-white dark:bg-slate-900/40 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium px-4 pr-12 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  {t("confirm_password", "Confirm Password")}
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full h-14 rounded-xl border-slate-200 bg-slate-50/50 dark:bg-transparent focus:bg-white dark:bg-slate-900/40 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium px-4 text-slate-900 dark:text-slate-100"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-white transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-600/20"
              >
                {loading ? 'Updating...' : 'Update password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
