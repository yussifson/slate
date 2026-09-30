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
      const { initiateGoogleOAuth } = await import('@/lib/googleOAuth');
      const googleAuthUrl = await initiateGoogleOAuth(redirectUrl);
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
      // Check for multiple workspaces safely (RPC optional)
      let userWorkspaces = null;
      let rpcError = null;
      try {
        const res = await supabase.rpc('get_user_workspaces_by_email', { lookup_email: email });
        userWorkspaces = res.data;
        rpcError = res.error;
      } catch (err) {
        rpcError = err;
      }
      
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
      <div className="h-[100dvh] w-full bg-[#00beac] flex items-center justify-center p-3 md:p-6 overflow-hidden font-sans text-slate-900">
        <div className="w-full max-w-6xl max-h-[94vh] h-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch my-auto">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white rounded-[28px] p-6 lg:p-8 border border-white/30 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Logo & Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#006065] flex items-center justify-center text-white shadow-sm">
                    <CliPadLogo size={20} />
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-[#006065]">
                    CliPad
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#006065] bg-[#006065]/10 px-2.5 py-0.5 rounded-full">
                  Workspace Login
                </span>
              </div>

              {/* Welcome Heading */}
              <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#006065] tracking-tight mb-1">
                  Welcome back
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Sign in to access your CliPad spaces, documents, and recordings.
                </p>
              </div>

              {/* Social Logins */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <button
                  onClick={handleSSOLogin}
                  type="button"
                  className="flex items-center justify-center gap-2 h-10 px-3 bg-slate-50 hover:bg-slate-100 text-[#006065] border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <Logo hideText={true} className="w-4 h-4 text-[#006065]" />
                  Optavel SSO
                </button>
                <button 
                  onClick={handleGoogleOAuth}
                  disabled={loading}
                  type="button"
                  className="flex items-center justify-center gap-2 h-10 px-3 bg-slate-50 hover:bg-slate-100 text-[#006065] border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">Or email</span>
                </div>
              </div>

              {!showWorkspaceSelect ? (
                <form onSubmit={handleEmailLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full pl-10 pr-4 h-10 text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-[#006065] focus:ring-1 focus:ring-[#006065]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="block text-[11px] font-semibold text-slate-600">Password</label>
                      <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-bold text-[#006065] hover:underline">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 h-10 text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-[#006065] focus:ring-1 focus:ring-[#006065]"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 mt-1 bg-[#006065] hover:bg-[#004d52] text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-center text-[#006065] mb-1">Select Workspace</h3>
                  <p className="text-xs text-center text-slate-500 mb-3">Multiple accounts found for {email}. Choose one to access:</p>
                  
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.company_id}
                        onClick={() => handleWorkspaceSelect(ws.salted_email)}
                        disabled={loading}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-left transition-all group"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-xs">{ws.company_name || 'My Workspace'}</span>
                          <span className="text-[11px] text-slate-500 mt-0.5">{ws.salted_email}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#006065] transition-colors" />
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setShowWorkspaceSelect(false);
                      setPassword('');
                    }} 
                    disabled={loading}
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-[#006065] pt-2 border-t border-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="text-center pt-4 mt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Don't have an account? </span>
              <span className="text-xs font-bold text-[#006065] cursor-pointer hover:underline" onClick={() => navigate(`/signup${window.location.search}`)}>
                Sign up
              </span>
            </div>
          </div>

          {/* Right Column: Hero Dark Green Card */}
          <div className="lg:col-span-5 bg-[#006065] rounded-[28px] p-6 lg:p-8 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl h-full min-h-[380px]">
            {/* Background ambient light */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#00beac]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#fad503]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Arcana style logo mark */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                <div className="w-2 h-2 rounded-full bg-[#fad503] animate-pulse" />
                <span className="text-[11px] font-bold tracking-wide uppercase text-white/90">CliPad Enterprise</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#fad503] flex items-center justify-center text-[#006065] shadow-md">
                <CliPadLogo size={20} className="text-[#006065]" />
              </div>
            </div>

            {/* Middle content */}
            <div className="relative z-10 my-auto py-4">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                Welcome to CliPad
              </h2>
              <p className="text-xs text-white/80 font-normal leading-relaxed">
                Connect your team spaces, transcribe meetings automatically, and search your entire organization's memory.
              </p>
            </div>

            {/* Charcoal Glass Sub-Card */}
            <div className="relative z-10 bg-[#004d52]/90 backdrop-blur-xl border border-white/15 rounded-2xl p-4 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-7 w-7 rounded-full border-2 border-[#004d52] bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center">CP</div>
                  <div className="inline-block h-7 w-7 rounded-full border-2 border-[#004d52] bg-teal-600 text-[9px] font-bold text-white flex items-center justify-center">AI</div>
                  <div className="inline-block h-7 w-7 rounded-full border-2 border-[#004d52] bg-slate-700 text-[9px] font-bold text-white flex items-center justify-center">KG</div>
                  <div className="inline-block h-7 w-7 rounded-full border-2 border-[#004d52] bg-[#fad503] text-[9px] font-extrabold text-[#006065] flex items-center justify-center">+17k</div>
                </div>
                <div className="flex items-center gap-1 text-[#fad503] text-xs font-bold">
                  ★★★★★ <span className="text-white/80 text-[10px] ml-1">5.0</span>
                </div>
              </div>
              <p className="text-[11px] text-white/90 font-medium leading-snug">
                More than 17,000+ professionals rely on CliPad for daily collaborative productivity.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

