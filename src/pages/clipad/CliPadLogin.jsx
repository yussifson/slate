import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { logAuditEvent } from '@/lib/auditLogger';
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
  const [workspaces, setWorkspaces] = useState([]);
  const [showWorkspaceSelect, setShowWorkspaceSelect] = useState(false);

  const handleSSOLogin = () => {
    const continueUrl = encodeURIComponent(`${window.location.origin}/auth/callback?continue=%2Fdashboard`);
    window.location.href = `https://account.optavel.com/sso?redirect_uri=${continueUrl}`;
  };

  const logLoginEvent = async (user) => {
    await logAuditEvent({ action: 'login', user });
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      // Check for multiple workspaces
      const { data: userWorkspaces, error: rpcError } = await supabase.rpc('get_user_workspaces_by_email', { lookup_email: email });
      
      if (!rpcError && userWorkspaces && userWorkspaces.length > 1) {
        setWorkspaces(userWorkspaces);
        setShowWorkspaceSelect(true);
        setLoading(false);
        return; // Pause login to let user select
      }
      
      // If exactly 1 workspace found via salt, use it. Otherwise fallback to raw email
      const loginEmail = (userWorkspaces && userWorkspaces.length === 1) ? userWorkspaces[0].salted_email : email;
      
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (error) throw error;
      
      await logLoginEvent(data.user);
      
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Sign in failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSelect = async (saltedEmail) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: saltedEmail, password });
      if (error) throw error;
      
      await logLoginEvent(data.user);
      
      navigate('/dashboard');
    } catch (err) {
      toast({ title: 'Sign in failed', description: err.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In — CliPad Collaborative Workspace</title>
        <meta name="description" content="Sign in to your enterprise-grade collaborative productivity workspace." />
        <link rel="icon" type="image/svg+xml" href="/clipad-logo.svg" />
      </Helmet>
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-full bg-slate-50 dark:bg-background flex flex-col items-center justify-center p-4 relative text-slate-900 dark:text-slate-100">
        
        {/* Subtle sleek background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(120,120,120,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,120,120,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-card flex items-center justify-center border border-slate-200 dark:border-border shadow-sm text-primary">
              <CliPadLogo size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-center text-slate-900 dark:text-white">Welcome to CliPad</h1>
            <p className="text-sm text-slate-500 dark:text-muted-foreground text-center">Sign in to access your spaces and recordings.</p>
          </div>

          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            {mode === 'sso' && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleSSOLogin}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-secondary dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-border font-semibold text-sm transition-colors"
                >
                  <Logo hideText className="w-5 h-5 text-primary" />
                  Continue with Optavel
                </button>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-100 dark:bg-secondary" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-secondary" />
                </div>

                <button
                  onClick={() => setMode('email')}
                  className="w-full py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-card dark:hover:bg-slate-800 border border-slate-200 dark:border-border text-slate-600 dark:text-foreground font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-slate-400" />
                  Sign in with email
                </button>
              </div>
            )}

            {mode === 'email' && !showWorkspaceSelect && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-muted-foreground mb-1.5 tracking-wide">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-background border border-slate-200 dark:border-border text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-muted-foreground tracking-wide">Password</label>
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-semibold text-primary hover:underline transition-colors">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white dark:bg-background border border-slate-200 dark:border-border text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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

            {mode === 'email' && showWorkspaceSelect && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-center text-slate-900 dark:text-white mb-2">Select Workspace</h3>
                <p className="text-sm text-center text-slate-500 dark:text-muted-foreground mb-4">We found multiple accounts associated with {email}. Which workspace would you like to access?</p>
                
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.company_id}
                      onClick={() => handleWorkspaceSelect(ws.salted_email)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-border bg-white hover:bg-slate-50 dark:bg-background dark:hover:bg-slate-900 transition-all text-left group"
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white text-sm">{ws.company_name || 'My Workspace'}</span>
                        <span className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">{ws.salted_email}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0" />
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => {
                    setShowWorkspaceSelect(false);
                    setPassword('');
                  }} 
                  disabled={loading}
                  className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mt-4 pt-4 border-t border-slate-100 dark:border-border"
                >
                  Cancel
                </button>
              </div>
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

