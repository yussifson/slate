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
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
            first_name: firstName.trim(),
            last_name: lastName.trim(),
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
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] selection:bg-primary/20 relative overflow-hidden">
      {/* Decorative abstract background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl opacity-50 mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }}></div>

      <div className="w-full max-w-[440px] px-6 relative z-10 my-12">
        <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 sm:p-12 backdrop-blur-xl">
          {/* Sleek Logo Area */}
          <div className="mb-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
              <Logo className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-semibold text-slate-900 tracking-tight leading-tight text-center">
              Create an Account
            </h1>
            <p className="text-slate-500 text-sm mt-3 tracking-wide font-medium text-center">
              One account for everything Optavel
            </p>
          </div>

          {/* Form Area */}
          <div className="w-full">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider ml-1">First name</label>
                  <Input
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full h-12 px-4 text-base bg-slate-50/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider ml-1">Last name</label>
                  <Input
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-12 px-4 text-base bg-slate-50/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider ml-1">Email address</label>
                <Input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 text-base bg-slate-50/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider ml-1">Password</label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 px-4 text-base bg-slate-50/50 border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
                />
              </div>
              
              <div className="pt-3 pb-5">
                 <p className="text-xs text-slate-500 text-center leading-relaxed font-medium">
                   By creating an account, you agree to the Optavel <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                 </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all active:scale-[0.98]" 
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-10 flex justify-center gap-1.5 text-sm font-medium">
              <span className="text-slate-500">Already have an account?</span>
              <a href="/login" className="text-primary hover:text-primary/80 transition-colors">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
