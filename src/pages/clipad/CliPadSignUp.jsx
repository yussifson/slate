import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { CliPadLogo } from '@/components/ui/CliPadLogo';

export default function CliPadSignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/search';
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      // Basic sign up - no workspace resolution needed yet since they are creating an account
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?continue=${encodeURIComponent(redirectUrl)}`
        }
      });
      if (error) throw error;
      
      toast({ title: 'Sign up successful', description: 'Please check your email to verify your account if required, or wait to be redirected.', variant: 'default' });
      
      // Auto-redirect or let auth state change handle it
      if (data?.session) {
        navigate(redirectUrl);
      }
    } catch (err) {
      toast({ title: 'Sign up failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up — CliPad Collaborative Workspace</title>
        <meta name="description" content="Create your enterprise-grade collaborative productivity workspace." />
        <link rel="icon" type="image/svg+xml" href="/clipad-favicon-round.svg" />
      </Helmet>
      <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#f8fafc] flex flex-col md:flex-row overflow-hidden font-sans text-slate-900 shadow-none">
        
        {/* Left 50% Panel: Form */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center p-4 sm:p-8 md:p-12 overflow-hidden shadow-none border-r border-slate-100">
          <div className="max-w-md w-full mx-auto py-2 sm:py-4">
            {/* Logo & Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#006065] flex items-center justify-center shadow-sm">
                  <CliPadLogo size={24} />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-[#00beac]">
                  CliPad
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00beac] bg-[#006065]/10 px-3 py-1 rounded-full">
                Create Account
              </span>
            </div>

            {/* Welcome Heading */}
            <div className="mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight mb-1 sm:mb-2">
                Join CliPad
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Create an account to start collaborating with your team on CliPad.
              </p>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
              <button
                onClick={handleSSOLogin}
                type="button"
                className="flex items-center justify-center gap-2 h-10 sm:h-11 px-3 bg-slate-50 hover:bg-slate-100 text-[#00beac] border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Logo hideText={true} className="w-4 h-4 text-[#00beac]" />
                Optavel SSO
              </button>
              <button 
                onClick={handleGoogleOAuth}
                disabled={loading}
                type="button"
                className="flex items-center justify-center gap-2 h-10 sm:h-11 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
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

            <div className="relative mb-4 sm:mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">Or register with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailSignUp} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 h-10 sm:h-11 text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-[#00beac] focus:ring-2 focus:ring-[#00beac]/20 transition-all outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-10 pr-10 h-10 sm:h-11 text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-[#00beac] focus:ring-2 focus:ring-[#00beac]/20 transition-all outline-none"
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
                className="w-full h-10 sm:h-11 mt-1 sm:mt-2 bg-[#00beac] hover:bg-[#00a898] text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
              </button>
            </form>

            <div className="text-center pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Already have an account? </span>
              <span className="text-xs font-bold text-[#00beac] cursor-pointer hover:underline" onClick={() => navigate(`/login${window.location.search}`)}>
                Sign in
              </span>
            </div>
          </div>
        </div>

        {/* Right 50% Panel: Geometric Artwork */}
        <div className="hidden md:flex md:w-1/2 bg-[#0b0f19] relative overflow-hidden flex-col justify-between p-10 select-none">
          {/* Ambient Glows */}
          <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] bg-[#00beac]/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] bg-[#6366f1]/20 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute top-[40%] right-[10%] w-[320px] h-[320px] bg-[#a855f7]/15 rounded-full blur-[100px] pointer-events-none" />

          {/* Center Geometric SVG Artwork */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center py-4">
            <svg width="280" height="280" viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
              {/* Intersecting Glowing Polygons */}
              <rect x="60" y="60" width="200" height="200" rx="36" transform="rotate(15 160 160)" fill="url(#geo-grad1)" opacity="0.8" />
              <rect x="60" y="60" width="200" height="200" rx="36" transform="rotate(-30 160 160)" fill="url(#geo-grad2)" opacity="0.65" />
              <circle cx="160" cy="160" r="70" fill="url(#geo-grad3)" opacity="0.9" />
              
              {/* 3D Geometric Nodes & Vectors */}
              <polygon points="160,50 200,80 160,110 120,80" fill="#00beac" opacity="0.95" />
              <polygon points="160,110 200,80 200,130 160,160" fill="#006065" opacity="0.9" />
              <polygon points="160,110 120,80 120,130 160,160" fill="#004d52" opacity="0.9" />

              <polygon points="260,170 290,190 260,210 230,190" fill="#fad503" opacity="0.85" />
              <polygon points="60,220 85,235 60,250 35,235" fill="#a855f7" opacity="0.85" />

              <line x1="160" y1="80" x2="260" y2="190" stroke="#00beac" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
              <line x1="160" y1="160" x2="60" y2="235" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
              <circle cx="260" cy="190" r="4" fill="#fad503" />
              <circle cx="60" cy="235" r="4" fill="#a855f7" />

              <defs>
                <linearGradient id="geo-grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#006065" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="geo-grad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00beac" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
                <linearGradient id="geo-grad3" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#00beac" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fad503" stopOpacity="0.9" />
                </linearGradient>
              </defs>
            </svg>

            <h2 className="text-2xl font-black text-white text-center mt-6 tracking-tight">
              Empower your team
            </h2>
            <p className="text-xs text-slate-400 text-center max-w-sm mt-2 leading-relaxed font-medium">
              Unlock collaborative AI notes, structured workspace knowledge, and seamless team operations with CliPad.
            </p>
          </div>

          {/* Bottom Card */}
          <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-[#0b0f19] flex items-center justify-center text-[10px] font-bold text-white">AI</div>
                <div className="w-8 h-8 rounded-full bg-[#006065] border-2 border-[#0b0f19] flex items-center justify-center text-[10px] font-bold text-white">CP</div>
                <div className="w-8 h-8 rounded-full bg-[#00beac] border-2 border-[#0b0f19] flex items-center justify-center text-[10px] font-bold text-white">+17k</div>
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Instant Access</p>
                <p className="text-[10px] text-slate-400">Join 17,000+ teams collaborating today</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[#fad503] text-xs font-bold">
              ★★★★★ <span className="text-white text-[11px] ml-1">5.0</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

