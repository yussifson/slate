import { supabase} from '@/api/supabaseClient';
import { useTranslation} from "react-i18next";
import { useState} from 'react';
import { powerSync} from "@/api/PowerSyncConnector";
import { Input} from '@/components/ui/input';
import { Button} from '@/components/ui/button';
import { getSubdomainAndBase} from '@/lib/domainUtils';
import { ArrowLeft, Mail, CheckCircle2} from 'lucide-react';

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

export default function ForgotPassword() {
 const { t} = useTranslation();
 const [email, setEmail] = useState('');
 const [loading, setLoading] = useState(false);
 const [sent, setSent] = useState(false);
 const [error, setError] = useState('');

 const { currentSubdomain, baseDomain} = getSubdomainAndBase();
 const port = window.location.port ? `:${window.location.port}` : '';
 const base = currentSubdomain
 ? `${window.location.protocol}//${currentSubdomain}.${baseDomain}${port}`
 : `${window.location.protocol}//${baseDomain}${port}`;

 const handleSubmit = async (e) => {
 e.preventDefault();
 setError('');
 setLoading(true);
 try {
 const { error: err} = await supabase.auth.resetPasswordForEmail(email, {
 redirectTo: `${base}/reset-password`});
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
 <div className="bg-white dark:bg-card/40 rounded-2xl border-[0.5px] border-black/9 dark:border-white/8 border-primary/40 dark:border-primary/40 p-10 space-y-8 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200">
 {/* Logo */}
 <div className="flex flex-col items-center gap-3 text-center">
 <div className="flex flex-col items-center mb-2">
 <Logo className="w-12 h-12" />
 <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-[0.2em] uppercase mt-1 tracking-[0.04em]">by Optavel</span>
 </div>
 <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight tracking-[-0.02em]">{t("reset_your_password", "Reset your password")}</h1>
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
 <a href="/login" className="text-sm font-semibold text-primary hover:underline flex items-center gap-2 mt-2">
 <ArrowLeft className="w-4 h-4" /> {t("back_to_login", "Back to login")}
 </a>
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
 className="w-full h-14 rounded-xl border-primary/40 bg-slate-50/50 dark:bg-transparent focus:bg-white dark:bg-card/40 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium pl-11 pr-4 text-slate-900 dark:text-slate-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.07)] transition-shadow duration-200"
 />
 </div>
 </div>

 <Button
 type="submit"
 disabled={loading}
 className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-white transition-all hover:-translate-y-0.5 -emerald-600/20"
 >
 {loading ? 'Sending...' : 'Send reset link'}
 </Button>

 <div className="text-center">
 <a href="/login" className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2">
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
