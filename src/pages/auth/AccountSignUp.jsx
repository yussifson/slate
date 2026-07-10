import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/api/supabaseClient";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { Logo } from '@/components/ui/Logo';

export default function AccountSignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [fullName, setFullName] = useState('');
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
        const handoff = async () => {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
             const token = encodeURIComponent(data.session.access_token);
             const refresh = encodeURIComponent(data.session.refresh_token);
             const separator = redirectUri.includes('?') ? '&' : '?';
             window.location.href = `${redirectUri}${separator}sso_token=${token}&sso_refresh=${refresh}`;
          } else {
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          }
        }
      });

      if (signUpError) throw signUpError;

      // Upon success, Supabase will log them in (if email confirmation is off)
      // The useEffect will catch isAuthenticated and redirect them to the redirectUri
      if (!data.session) {
        setError('Please check your email to verify your account.');
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
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
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-background text-slate-900 dark:text-gray-100 selection:bg-primary/20">
      <div className="w-full max-w-[480px] p-6 sm:p-10 my-8">
        <div className="bg-white dark:bg-card rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 border-t-4 border-t-primary p-8 sm:p-12 shadow-sm">
          {/* Sleek Logo Area */}
          <div className="mb-8 flex flex-col items-center">
            <Logo className="w-10 h-10 mb-6" />
            <h1 className="text-2xl sm:text-[28px] font-normal tracking-tight text-center text-slate-900 dark:text-white mb-2">
              Create an Account
            </h1>
            <p className="text-slate-600 dark:text-gray-400 text-sm md:text-[15px] font-medium text-center">
              One account for everything Optavel
            </p>
          </div>

          {/* Form Area */}
          <div className="w-full">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/20 flex items-center justify-center text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <Input
                  type="text"
                  required
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-14 px-4 text-[15px] bg-transparent border-gray-300 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <Input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 px-4 text-[15px] bg-transparent border-gray-300 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-500"
                />
              </div>
              <div>
                <Input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-4 text-[15px] bg-transparent border-gray-300 dark:border-gray-700 text-slate-900 dark:text-white rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-500"
                />
              </div>
              
              <div className="pt-2 pb-5">
                 <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center leading-relaxed">
                   By creating an account, you agree to the Optavel <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                 </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                 <a href={`/login${window.location.search}`} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                   Sign in instead
                 </a>
                 <Button 
                   type="submit" 
                   className="h-11 px-6 text-[15px] font-medium rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-[0.98]" 
                   disabled={loading}
                 >
                   {loading ? 'Creating...' : 'Create account'}
                 </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
