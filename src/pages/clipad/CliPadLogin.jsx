import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { CliPadLogo } from '@/components/ui/CliPadLogo';

export default function CliPadLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState('sso');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSSOLogin = () => {
    const continueUrl = encodeURIComponent(`${window.location.origin}/auth/callback?continue=%2Fdashboard`);
    window.location.href = `https://account.optavel.com/sso?redirect_uri=${continueUrl}`;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Sign in failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In — CliPad</title>
        <link rel="icon" type="image/svg+xml" href="/clipad-logo.svg" />
      </Helmet>
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 relative text-slate-900 dark:text-slate-100">
        
        {/* Subtle sleek background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm text-primary">
              <CliPadLogo size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center text-slate-900 dark:text-white">Welcome to CliPad</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Sign in to access your spaces and recordings.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            {mode === 'sso' && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleSSOLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold text-sm transition-colors"
                >
                  <Logo hideText className="w-5 h-5 text-primary" />
                  Continue with Optavel
                </button>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                <button
                  onClick={() => setMode('email')}
                  className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  Sign in with email
                </button>
              </div>
            )}

            {mode === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : 'Sign In'}
                </button>
                <button type="button" onClick={() => setMode('sso')} className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors pt-2">
                  Use SSO instead
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            Joining a meeting?{' '}
            <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate('/')}>
              Go to meeting home
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

