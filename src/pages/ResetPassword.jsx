import { supabase} from '@/api/supabaseClient';
import { useTranslation} from "react-i18next";
import { useState, useEffect} from 'react';
import { powerSync} from "@/api/PowerSyncConnector";
import { base44 } from "@/api/base44Client";
import { Input} from '@/components/ui/input';
import { Button} from '@/components/ui/button';
import { CheckCircle2, Eye, EyeOff} from 'lucide-react';

function Logo({ className}) {
 return (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="50" cy="50" r="10" stroke="currentColor" className="text-primary" strokeWidth="8" />
    <path d="M 33 67 A 24 24 0 1 1 73.2 43.8" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round" />
    <path d="M 56.9 10.6 A 40 40 0 1 1 10.6 56.9" stroke="currentColor" className="text-primary" strokeWidth="8" strokeLinecap="round" />
  </svg>
 );
}

export default function ResetPassword() {
 const { t} = useTranslation();
 const [password, setPassword] = useState('');
 const [confirm, setConfirm] = useState('');
 const [showPassword, setShowPassword] = useState(false);
 const [loading, setLoading] = useState(false);
 const [done, setDone] = useState(false);
 const [error, setError] = useState('');

  // Supabase sends tokens as URL hash fragments; we need to set the session from them
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // If getSession didn't find it immediately, listen for the event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
             // Session is established
          }
        });
        return () => subscription.unsubscribe();
      }
    });
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
 await base44.auth.updatePassword(password);
 setDone(true);
 // Redirect to login after 3 seconds
  setTimeout(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const continueUrl = urlParams.get('continue');
    if (continueUrl) {
      window.location.href = `/login?continue=${encodeURIComponent(continueUrl)}`;
    } else {
      window.location.href = '/login';
    }
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
 <div className="bg-white dark:bg-card/40 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 p-10 space-y-8 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 <div className="flex flex-col items-center gap-3 text-center">
 <div className="flex flex-col items-center mb-2">
 <Logo className="w-12 h-12" />
 <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-[0.2em] uppercase mt-1 tracking-[0.04em]">by Optavel</span>
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight tracking-[-0.02em]">{t("set_new_password", "Set new password")}</h1>
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
 <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border-[0.5px] border-black/9 dark:border-white/8 border-red-100 font-medium">
 {error}
 </div>
 )}

 <div>
 <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 tracking-[0.04em]">
 {t("new_password", "New Password")}
 </label>
 <div className="relative">
 <Input
 type={showPassword ? 'text' : 'password'}
 required
 placeholder="Min. 6 characters"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="w-full h-14 rounded-xl border-primary/40 bg-slate-50/50 dark:bg-transparent focus:bg-white dark:bg-card/40 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium px-4 pr-12 text-slate-900 dark:text-slate-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
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
 <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 tracking-[0.04em]">
 {t("confirm_password", "Confirm Password")}
 </label>
 <Input
 type="password"
 required
 placeholder="Repeat password"
 value={confirm}
 onChange={(e) => setConfirm(e.target.value)}
 className="w-full h-14 rounded-xl border-primary/40 bg-slate-50/50 dark:bg-transparent focus:bg-white dark:bg-card/40 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium px-4 text-slate-900 dark:text-slate-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>

 <Button
 type="submit"
 disabled={loading}
 className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white transition-all hover:-translate-y-0.5 -emerald-600/20"
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
