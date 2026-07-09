import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/api/supabaseClient";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { isDesktopApp } from '@/lib/domainUtils';

export default function AccountLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoadingAuth } = useAuth();
  
  const redirectUri = searchParams.get('redirect_uri');

  // Handle SSO redirect logic if already authenticated
  useEffect(() => {
    if (isLoadingAuth) return;
    if (isAuthenticated) {
      if (redirectUri) {
        // We are already logged in, hand off the token to the redirect_uri
        const handoff = async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
             const token = encodeURIComponent(data.session.access_token);
             const refresh = encodeURIComponent(data.session.refresh_token);
             const separator = redirectUri.includes('?') ? '&' : '?';
             window.location.href = `${redirectUri}${separator}sso_token=${token}&sso_refresh=${refresh}`;
          } else {
             // Fallback
             window.location.href = redirectUri;
          }
        };
        handoff();
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, isLoadingAuth, redirectUri, navigate]);

  // Disconnect Auth Pages from Dashboard Theme Switcher to ensure pristine look
  useEffect(() => {
    const root = window.document.documentElement;
    const originalClass = root.className;
    
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';

    return () => {
      root.className = originalClass;
      root.style.colorScheme = '';
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (signInError) throw signInError;

      if (redirectUri) {
        const token = encodeURIComponent(data.session.access_token);
        const refresh = encodeURIComponent(data.session.refresh_token);
        const separator = redirectUri.includes('?') ? '&' : '?';
        window.location.href = `${redirectUri}${separator}sso_token=${token}&sso_refresh=${refresh}`;
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Invalid email or password." : err.message);
      setLoading(false);
    }
  };

  if (isLoadingAuth || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-medium">Authenticating...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white selection:bg-slate-100">
      <div className="w-full max-w-[420px] px-8 py-12 flex flex-col items-center">
        {/* Sleek Logo Area */}
        <div className="mb-10 flex flex-col items-center">
          <Logo className="w-12 h-12 mb-6" />
          <h1 className="text-[28px] font-semibold text-slate-900 tracking-[-0.03em] leading-tight">
            Sign in
          </h1>
          <p className="text-slate-500 text-sm mt-2 tracking-wide font-medium">
            Use your Optavel Account
          </p>
        </div>

        {/* Form Area */}
        <div className="w-full">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-14 px-4 text-base bg-white border-slate-200 text-slate-900 rounded-xl focus:border-slate-400 focus:ring-0 transition-all placeholder:text-slate-400"
              />
            </div>
            <div>
              <Input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-14 px-4 text-base bg-white border-slate-200 text-slate-900 rounded-xl focus:border-slate-400 focus:ring-0 transition-all placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center justify-between pt-2 pb-4">
               <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                 Forgot password?
               </a>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-medium rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-10 flex justify-center gap-1.5 text-sm font-medium">
            <span className="text-slate-500">Don't have an account?</span>
            <a href="/signup" className="text-blue-600 hover:text-blue-700 transition-colors">
              Create account
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
