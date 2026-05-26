import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { getSubdomainAndBase } from '@/lib/domainUtils';

export default function SignUp() {
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("Could not create user account.");

      const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!cleanSubdomain) throw new Error("Please enter a valid subdomain");

      // 2. Create the company
      const { data: companyData, error: compError } = await supabase.from('companies').insert({
        name: companyName,
        subdomain: cleanSubdomain,
        email: email,
        subscription_plan: 'starter',
        subscription_status: 'trial',
        status: 'active'
      }).select().single();

      if (compError) throw compError;

      // 3. Update the profile
      const { error: profError } = await supabase.from('profiles').update({
        company_id: companyData.id,
        company_name: companyData.name,
        role: 'company_admin'
      }).eq('id', user.id);

      if (profError) throw profError;

      setSuccess("Account and Firm successfully created! Redirecting to your login portal...");
      
      // Auto-redirect to their new subdomain
      setTimeout(() => {
        const { baseDomain } = getSubdomainAndBase();
        const port = window.location.port ? `:${window.location.port}` : '';
        const targetHost = `${companyData.subdomain}.${baseDomain}${port}`;
        
        window.location.href = `${window.location.protocol}//${targetHost}/login`;
      }, 2000);

    } catch (err) {
      setError(err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative p-4">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-8 rounded-xl bg-card p-8 shadow-xl border border-border/80">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Register your Law Firm</h2>
          <p className="mt-2 text-sm text-muted-foreground">Create an account to start managing your firm</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          {error && <div className="rounded bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">{error}</div>}
          {success && <div className="rounded bg-green-500/10 p-4 text-sm text-green-500 border border-green-500/20">{success}</div>}
          
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <Input
                type="text"
                required
                placeholder="Law Firm Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="text"
                required
                placeholder="Subdomain (e.g. yourfirm)"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="email"
                required
                placeholder="Admin Email address"
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>

          <div className="text-center mt-4">
            <a href="/login" className="text-sm text-primary hover:underline">
              Already have an account? Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
