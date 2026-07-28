import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { logAuditEvent } from '@/lib/auditLogger';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { CliPadLogo } from '@/components/ui/CliPadLogo';

export default function CliPadLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/search';
  const { toast } = useToast();
  const [mode, setMode] = useState('sso');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [showWorkspaceSelect, setShowWorkspaceSelect] = useState(false);
 
  const handleSSOLogin = () => {
    const continueUrl = encodeURIComponent(`${window.location.origin}/auth/callback?continue=${encodeURIComponent(redirectUrl)}`);
    window.location.href = `https://account.optavel.com/sso?redirect_uri=${continueUrl}`;
  };
 
  const handleGoogleOAuth = async () => {
    try {
      setLoading(true);
      const continueUrl = redirectUrl || '/search';
      
      let callbackPath = '/auth/callback';
      if (continueUrl) {
        callbackPath += `?continue=${encodeURIComponent(continueUrl)}`;
      }

      // We redirect directly to Google OIDC with account.optavel.com as the redirect URI
      // Google will see account.optavel.com (which has premium branding).
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = encodeURIComponent('https://account.optavel.com/auth/google-callback');
      
      // Generate and hash the nonce for Supabase verification
      const rawNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const encoder = new TextEncoder();
      const data = encoder.encode(rawNonce);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashedNonce = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const stateObj = {
        continue: window.location.origin + callbackPath,
        nonce: rawNonce
      };
      const state = encodeURIComponent(JSON.stringify(stateObj));
      
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20email%20profile&state=${state}&nonce=${hashedNonce}`;
      
      window.location.href = googleAuthUrl;
    } catch (err) {
      toast({ title: 'Google Sign-In failed', description: err.message, variant: 'destructive' });
      setLoading(false);
    }
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
      
      navigate(redirectUrl);
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
      
      navigate(redirectUrl);
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
        <link rel="icon" type="image/svg+xml" href="/clipad-favicon-round.svg" />
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

                <button
                  onClick={handleGoogleOAuth}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white hover:bg-slate-50 dark:bg-card dark:hover:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-border font-semibold text-sm transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      <path d="M1 1h22v22H1z" fill="none"/>
                    </svg>
                  )}
                  Sign in with Google
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

          <div className="flex flex-col gap-2 mt-8">
            <p className="text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate(`/signup${window.location.search}`)}>
                Sign up
              </span>
            </p>
            <p className="text-center text-xs text-slate-400">
              Joining a meeting?{' '}
              <span className="text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate('/')}>
                Go to meeting home
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

