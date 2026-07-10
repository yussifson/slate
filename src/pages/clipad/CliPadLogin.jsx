import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/api/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Video, Mail, Lock, Eye, EyeOff, ArrowRight, Users, Sparkles } from 'lucide-react';

export default function CliPadLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState('sso'); // 'sso' | 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // SSO redirect to account.optavel.com
  const handleSSOLogin = () => {
    const continueUrl = encodeURIComponent(`${window.location.origin}/auth/callback?continue=%2Fdashboard`);
    window.location.href = `https://account.optavel.com/sso?continue=${continueUrl}`;
  };

  // Direct email login
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#050A15] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Video className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">CliPad</span>
          </div>

          <div className="bg-[#111827]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-1 text-center">Welcome back</h1>
            <p className="text-sm text-gray-400 text-center mb-8">Sign in to access your spaces, recordings and AI insights.</p>

            {/* SSO Button — primary CTA */}
            {mode === 'sso' && (
              <>
                <button
                  onClick={handleSSOLogin}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all hover:scale-[1.01] mb-5"
                >
                  <Users className="w-5 h-5" />
                  Continue with Optavel Account
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-gray-500">or</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                <button
                  onClick={() => setMode('email')}
                  className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/8 border border-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4 text-gray-400" />
                  Sign in with email
                </button>
              </>
            )}

            {mode === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-all"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Sign In'}
                </button>
                <button type="button" onClick={() => setMode('sso')} className="w-full text-center text-xs text-gray-500 hover:text-gray-300 transition-colors pt-2">
                  ← Back to SSO options
                </button>
              </form>
            )}

            {/* Guest access note */}
            <div className="mt-6 pt-6 border-t border-white/8 text-center">
              <p className="text-xs text-gray-500">
                Joining a meeting?{' '}
                <span className="text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => navigate('/')}>
                  Go to meeting home
                </span>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-600 mt-6">
            Protected by end-to-end encryption · <span className="text-gray-500">Optavel Technologies</span>
          </p>
        </div>
      </div>
    </>
  );
}
