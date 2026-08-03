import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/api/supabaseClient";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { Logo } from '@/components/ui/Logo';

export default function AccountLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, isLoadingAuth } = useAuth();
  const redirectUri = searchParams.get('redirect_uri');

  // Disconnect Auth Pages from Dashboard Theme Switcher
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

  // Handle SSO redirect logic if already authenticated
  useEffect(() => {
    if (isLoadingAuth) return;
    const promptParam = searchParams.get('prompt');

    if (isAuthenticated && promptParam !== 'login') {
      if (redirectUri) {
        // Already logged in — hand off the token to the redirect_uri
        const handoff = async () => {
          try {
            const { data } = await supabase.auth.getSession();
            if (data?.session) {
              const token = encodeURIComponent(data.session.access_token);
              const refresh = encodeURIComponent(data.session.refresh_token);
              const separator = redirectUri.includes('?') ? '&' : '?';
              window.location.href = `${redirectUri}${separator}sso_token=${token}&sso_refresh=${refresh}`;
            } else {
              window.location.href = redirectUri;
            }
          } catch (err) {
            console.error('[AccountLogin] Handoff failed:', err);
            window.location.href = redirectUri;
          }
        };
        handoff();
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, isLoadingAuth, redirectUri, navigate, searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;

      if (redirectUri && data?.session) {
        const token = encodeURIComponent(data.session.access_token);
        const refresh = encodeURIComponent(data.session.refresh_token);
        const separator = redirectUri.includes('?') ? '&' : '?';
        window.location.href = `${redirectUri}${separator}sso_token=${token}&sso_refresh=${refresh}`;
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Invalid email or password.'
          : err.message
      );
      setLoading(false);
    }
  };

  // Show loading spinner while auth is initialising or we are about to redirect
  if (isLoadingAuth || (isAuthenticated && searchParams.get('prompt') !== 'login')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-pulse text-slate-400 font-medium">Authenticating...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-900 selection:bg-primary/20">
      <div className="w-full max-w-[480px] p-6 sm:p-10 my-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-t-4 border-gray-200 border-t-primary p-8 sm:p-12 shadow-sm">

          {/* Logo & Heading */}
          <div className="mb-8 flex flex-col items-center">
            <Logo className="w-10 h-10 mb-6" />
            <h1 className="text-2xl sm:text-[28px] font-normal tracking-tight text-center text-slate-900 mb-2">
              Sign in
            </h1>
            <p className="text-slate-600 text-sm md:text-[15px] font-medium text-center">
              Continue to Optavel Account
            </p>
          </div>

          {/* Form */}
          <div className="w-full">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center text-center">
                {error}
              </div>
            )}

            <div className="mb-6">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { initiateGoogleOAuth } = await import('@/lib/googleOAuth');
                    const url = await initiateGoogleOAuth(redirectUri);
                    window.location.href = url;
                  } catch (err) {
                    setError("Google Sign-In failed: " + err.message);
                    setLoading(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white border border-gray-300 text-slate-700 font-medium text-[15px] hover:bg-slate-50 transition-all shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400 font-semibold tracking-wider">Or email</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  required
                  placeholder="Email or phone"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 px-4 text-[15px] bg-transparent border-gray-300 text-slate-900 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-500"
                />
              </div>

              <div>
                <Input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-4 text-[15px] bg-transparent border-gray-300 text-slate-900 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-500"
                />
              </div>

              <div className="flex items-center justify-start pt-1 pb-6">
                <a
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={`/signup${window.location.search}`}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Create account
                </a>
                <Button
                  type="submit"
                  className="h-11 px-6 text-[15px] font-medium rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Next'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
