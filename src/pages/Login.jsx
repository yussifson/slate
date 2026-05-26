import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle } from 'lucide-react';
import ThemeToggle from '@/components/layout/ThemeToggle';

import { getSubdomainAndBase, getMainAppUrl } from '@/lib/domainUtils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState({ name: 'LexAfrica', logo_url: null, tagline: 'Enter your credentials to access your account' });
  
  const { currentSubdomain, baseDomain } = getSubdomainAndBase();

  const [checkingSubdomain, setCheckingSubdomain] = useState(!!currentSubdomain);
  const [invalidSubdomain, setInvalidSubdomain] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      if (currentSubdomain) {
        try {
          // Use RPC to bypass RLS securely for public branding info
          const { data, error } = await supabase.rpc('get_company_by_subdomain', { p_subdomain: currentSubdomain });
          
          if (error) {
             console.error("Could not fetch branding via RPC", error);
             // Fallback to table query if RPC is not created yet (for development)
             const { data: tableData, error: tableError } = await supabase.from('companies').select('name, logo_url, logo_light_url').eq('subdomain', currentSubdomain).single();
             if (tableData) {
               setBranding({ name: tableData.name || 'LexAfrica', logo_url: tableData.logo_url || tableData.logo_light_url, tagline: `Sign in to ${tableData.name || 'your firm'}` });
             } else if (tableError) {
               console.error("Table fallback error:", tableError);
               setInvalidSubdomain(true);
             }
          } else if (data && data.name) {
            setBranding({
              name: data.name || 'LexAfrica',
              logo_url: data.logo_url || data.logo_light_url,
              tagline: `Sign in to ${data.name || 'your firm'}`
            });
          } else {
             // RPC succeeded but returned null/empty
             setInvalidSubdomain(true);
          }
        } catch (err) {
          console.error("Could not fetch branding", err);
        } finally {
          setCheckingSubdomain(false);
        }
      }
    };
    fetchBranding();
  }, [currentSubdomain]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (currentSubdomain) {
      // Check if user belongs to this subdomain
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', authData.user.id).single();
      if (profile?.company_id) {
        const { data: company } = await supabase.from('companies').select('name, subdomain').eq('id', profile.company_id).single();
        const companySubdomain = company?.subdomain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
        
        if (companySubdomain && companySubdomain !== currentSubdomain) {
          await supabase.auth.signOut();
          setError(`Invalid Firm Identity! Your credentials are correct, but they belong to "${company?.name}". Please go to ${companySubdomain}.${baseDomain} to log in.`);
          setLoading(false);
          return;
        }
      }
      window.location.href = '/';
    } else {
      // Base domain login - redirect to their subdomain or onboarding
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', authData.user.id).single();
      if (profile?.company_id) {
        const { data: company } = await supabase.from('companies').select('name, subdomain').eq('id', profile.company_id).single();
        const companySubdomain = company?.subdomain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
        
        if (companySubdomain) {
          const port = window.location.port ? `:${window.location.port}` : '';
          window.location.href = `${window.location.protocol}//${companySubdomain}.${baseDomain}${port}/`;
          return;
        }
      }
      // If no company, go to onboarding
      window.location.href = '/onboarding';
    }
  };

  if (checkingSubdomain) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-medium">Checking firm access...</div>
      </div>
    );
  }

  if (invalidSubdomain) {
    const mainUrl = `${getMainAppUrl()}/login`;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md space-y-6 rounded-xl bg-card p-8 shadow-xl text-center border border-border">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Firm Not Found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find a law firm matching the web address <span className="font-semibold text-foreground">"{currentSubdomain}"</span>.
            </p>
          </div>
          <div className="pt-4 border-t border-border">
            <Button onClick={() => window.location.href = mainUrl} variant="outline" className="w-full">
              Go to Main Login Portal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative p-4">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-8 shadow-xl border border-border/80">
        <div className="text-center">
          {branding.logo_url ? (
            <img src={branding.logo_url} alt={branding.name} className="h-16 mx-auto mb-4 object-contain" />
          ) : (
            <div className="h-16 w-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{branding.name[0]}</span>
            </div>
          )}
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign in to {branding.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{branding.tagline}</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && <div className="rounded bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">{error}</div>}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center mt-4">
            <a href="/signup" className="text-sm text-primary hover:underline">
              Don't have an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
