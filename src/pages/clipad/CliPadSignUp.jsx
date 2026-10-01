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
      <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#eef2f6] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans text-slate-900 overflow-hidden select-none">
        
        {/* Main Outer Split Card Container */}
        <div className="w-full max-w-6xl h-full max-h-[720px] lg:max-h-[760px] bg-white rounded-[24px] sm:rounded-[32px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] flex flex-col lg:flex-row border border-slate-200/80 overflow-hidden p-2 sm:p-3 lg:p-3.5">
          
          {/* Left Panel: Form */}
          <div className="w-full lg:w-1/2 bg-white flex flex-col justify-between p-6 sm:p-8 lg:p-12 overflow-y-auto">
            <div className="max-w-sm w-full mx-auto my-auto py-2">
              
              {/* Top Logo */}
              <div className="flex items-center gap-2.5 mb-6 sm:mb-8">
                <CliPadLogo size={28} />
                <span className="font-extrabold text-2xl tracking-tight text-slate-900">
                  CliPad
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1.5">
                  Create your account
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Please enter your details to get started
                </p>
              </div>

              {/* Form Content */}
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 h-11 text-sm bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#006065] focus:ring-2 focus:ring-[#006065]/15 transition-all outline-none shadow-sm placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full pl-10 pr-10 h-11 text-sm bg-white border border-slate-200 text-slate-900 rounded-xl focus:border-[#006065] focus:ring-2 focus:ring-[#006065]/15 transition-all outline-none shadow-sm placeholder:text-slate-400"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Options Row: Terms Agreement */}
                <div className="flex items-center pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      required
                      className="w-4 h-4 rounded border-slate-300 text-[#006065] focus:ring-[#006065] accent-[#006065]" 
                    />
                    <span className="text-xs text-slate-600 font-medium">I agree to the Terms & Privacy Policy</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-[#006065] hover:bg-[#004d52] text-white font-bold rounded-xl text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Get Started'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold tracking-widest text-[10px]">OR</span>
                </div>
              </div>

              {/* Secondary SSO / SmartCard Login */}
              <div className="space-y-2">
                <button
                  onClick={handleSSOLogin}
                  type="button"
                  className="w-full h-11 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Logo hideText={true} className="w-4 h-4 text-[#006065]" />
                  Sign up with Optavel SSO
                </button>
                <button 
                  onClick={handleGoogleOAuth}
                  disabled={loading}
                  type="button"
                  className="w-full h-11 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign up with Google
                </button>
              </div>

              {/* Footer Switcher */}
              <div className="text-center pt-6 text-xs text-slate-500 font-medium">
                Already have an account?{' '}
                <span className="font-bold text-[#006065] cursor-pointer hover:underline" onClick={() => navigate(`/login${window.location.search}`)}>
                  Log in
                </span>
              </div>
            </div>
          </div>

          {/* Right Panel: Deep Teal Inset Card with Tilted Device Mockup */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#006065] via-[#005055] to-[#00393d] relative overflow-hidden flex-col justify-between p-10 lg:p-12 text-white rounded-[20px] sm:rounded-[26px] select-none shadow-inner">
            
            {/* Top Branding & Headline */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <CliPadLogo size={26} color="#ffffff" dotColor="#fad503" />
                <span className="font-extrabold text-xl tracking-tight text-white">CliPad</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight max-w-sm mt-3">
                Empowering healthier communities
              </h2>
            </div>

            {/* Bottom Right Tilted Perspective 3D Tablet Mockup */}
            <div className="absolute -bottom-16 -right-16 w-[520px] lg:w-[600px] h-[460px] pointer-events-none select-none transition-transform duration-700 hover:scale-[1.02]">
              <div 
                className="w-full h-full bg-slate-900 p-2.5 rounded-[30px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] border border-slate-700/50 flex flex-col"
                style={{
                  transform: 'perspective(1200px) rotateX(12deg) rotateY(-18deg) rotate(-10deg)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Inner Device Screen */}
                <div className="w-full h-full bg-[#f8fafc] rounded-[22px] overflow-hidden flex flex-row text-[10px] text-slate-800 font-sans shadow-inner">
                  {/* Sidebar */}
                  <div className="w-44 bg-[#006065] text-white p-3 flex flex-col justify-between shrink-0">
                    <div>
                      <div className="flex items-center gap-1.5 mb-4">
                        <CliPadLogo size={14} color="#00beac" />
                        <span className="font-bold tracking-tight text-xs text-white">CliPad</span>
                      </div>

                      <div className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-1.5">General</div>
                      <div className="space-y-1 mb-3">
                        <div className="bg-[#fad503] text-[#006065] font-bold px-2 py-1 rounded-md flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#006065]"></span> Home
                        </div>
                        <div className="text-white/70 hover:text-white px-2 py-1">Search</div>
                        <div className="text-white/70 hover:text-white px-2 py-1">Spaces</div>
                      </div>

                      <div className="text-[9px] uppercase font-bold text-white/40 tracking-wider mb-1.5">Intelligence</div>
                      <div className="space-y-1">
                        <div className="text-white/70 px-2 py-0.5">Capture</div>
                        <div className="text-white/70 px-2 py-0.5">Analytics</div>
                        <div className="text-white/70 px-2 py-0.5">Graph</div>
                        <div className="text-white/70 px-2 py-0.5">Timeline</div>
                        <div className="text-white/70 px-2 py-0.5">Decisions</div>
                        <div className="text-white/70 px-2 py-0.5">Action Items</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 text-white/50 text-[8px]">
                      Admin Enterprise
                    </div>
                  </div>

                  {/* Main App Content View */}
                  <div className="flex-1 bg-white p-3.5 flex flex-col justify-between overflow-hidden">
                    <div>
                      {/* Header Bar */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-xs font-extrabold text-slate-900">Welcome Back</div>
                          <div className="text-[8px] text-slate-500">Manage your patient & workspace records</div>
                        </div>
                        <div className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-400 text-[8px] flex items-center gap-1">
                          🔍 Search...
                        </div>
                      </div>

                      {/* Stat Cards */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                          <div className="text-slate-400 text-[8px] font-semibold">Avg. Consultation Time</div>
                          <div className="text-xs font-extrabold text-slate-900 mt-0.5">64 mins</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                          <div className="text-slate-400 text-[8px] font-semibold">Patient Records</div>
                          <div className="text-xs font-extrabold text-[#006065] mt-0.5">Recently accessed</div>
                        </div>
                      </div>

                      {/* Records Table Mockup */}
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-2.5 py-1 border-b border-slate-100 font-bold text-slate-600 text-[8px] flex justify-between">
                          <span>Full Name</span>
                          <span>Age / Status</span>
                        </div>
                        <div className="divide-y divide-slate-100 text-[8px]">
                          <div className="px-2.5 py-1 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">Candice Wu</span>
                            <span className="bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded text-[7px]">58 yrs</span>
                          </div>
                          <div className="px-2.5 py-1 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">Liam Chen</span>
                            <span className="bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded text-[7px]">39 yrs</span>
                          </div>
                          <div className="px-2.5 py-1 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">Sophia Patel</span>
                            <span className="bg-rose-50 text-rose-600 font-bold px-1.5 py-0.5 rounded text-[7px]">3 alerts</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[8px] text-slate-400 pt-1.5 border-t border-slate-100">
                      <span>CliPad V3</span>
                      <span className="text-[#00beac] font-bold">● System Operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </>
  );
}

