import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { useTranslation } from "react-i18next";
import { getSavedAccounts, removeAccount } from "@/lib/multiAccountUtils";
import { LogOut, Plus, ChevronRight, AlertCircle, Shield, Key, Lock, Hexagon, Box, Fingerprint } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/AuthContext";

export default function SSOGateway() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUri = searchParams.get("redirect_uri");
  
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetHost, setTargetHost] = useState("");
  const [globalError, setGlobalError] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!redirectUri) {
      setGlobalError("Missing redirect_uri parameter");
      setIsLoading(false);
      return;
    }

    try {
      const url = new URL(redirectUri);
      
      // Basic security check
      if (!url.hostname.endsWith('optavel.com') && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        throw new Error("Invalid redirect URI domain");
      }
      
      setTargetHost(url.hostname);
      
      const saved = getSavedAccounts();
      if (saved.length === 0) {
        // No saved accounts, go straight to login
        navigate(`/login?redirect_uri=${encodeURIComponent(redirectUri)}`, { replace: true });
        return;
      }
      
      setAccounts(saved);
      setIsLoading(false);
    } catch (err) {
      setGlobalError("Invalid redirect_uri format or unauthorized domain.");
      setIsLoading(false);
    }
  }, [redirectUri, navigate]);

  const handleAccountSelect = async (account) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // 0. Check if already active
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession && currentSession.user.id === account.id) {
        // Already active! Skip setSession.
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        // 1. Swap active session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: account.access_token,
          refresh_token: account.refresh_token
        });
        
        if (sessionError) {
            // Attempt an explicit refresh in case setSession rejected an expired access token
            const { error: refreshError } = await supabase.auth.refreshSession({ refresh_token: account.refresh_token });
            
            if (refreshError) {
                // Token might be fully expired or revoked. Force login.
                removeAccount(account.id);
                // Redirect them to login automatically instead of getting stuck on an error
                handleAddAccount();
                return;
            }
        }
        
        // 2. Wait a brief moment for any background token refreshes to apply
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 3. Verify workspace access
      if (targetHost !== 'slate.optavel.com' && targetHost !== 'account.optavel.com' && targetHost !== 'localhost' && targetHost !== '127.0.0.1') {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', account.id).maybeSingle();
        
        if (!profile || !profile.company_id) {
            throw new Error(`This account is not associated with any workspace.`);
        }
        
        const { data: company } = await supabase.from('companies').select('subdomain, custom_domain').eq('id', profile.company_id).maybeSingle();
        
        if (!company) {
            throw new Error(`Workspace not found.`);
        }
        
        const validDomains = [];
        if (company.subdomain) validDomains.push(`${company.subdomain}.optavel.com`);
        if (company.custom_domain) validDomains.push(company.custom_domain);
        
        if (!validDomains.includes(targetHost)) {
            throw new Error(`This account does not have access to ${targetHost}.`);
        }
      }
      
      // 4. Redirect with the freshest tokens
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Failed to establish session after validation.");
      
      const hash = `#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
      window.location.href = `${redirectUri}${hash}`;
      
    } catch (err) {
      setAuthError(err.message);
      setIsLoading(false);
    }
  };

  const handleAddAccount = async () => {
    // Clear the active session so the user actually sees the login form, 
    // but preserve their account in the multi-account list.
    await logout(false, true);
    navigate(`/login?redirect_uri=${encodeURIComponent(redirectUri)}`);
  };

  const handleSignOutAccount = (e, userId) => {
      e.stopPropagation();
      removeAccount(userId);
      setAccounts(prev => prev.filter(a => a.id !== userId));
      if (accounts.length <= 1) {
          handleAddAccount();
      }
  };

  if (globalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 max-w-md w-full bg-card rounded-2xl shadow-xl border border-destructive/20 text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive font-bold text-xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">SSO Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{globalError}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <OrbitLoader size="lg" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {t("authenticating_sso", "Authenticating with Optavel Account...")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#090E17] p-4 relative overflow-hidden">
      
      {/* Sleek Icon Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute w-full max-w-6xl h-full">
          <div className="absolute top-[10%] left-[5%] opacity-[0.08] dark:opacity-[0.06] text-primary">
            <Shield size={180} strokeWidth={1.5} />
          </div>
          <div className="absolute top-[60%] left-[10%] opacity-[0.08] dark:opacity-[0.06] text-primary">
            <Key size={140} strokeWidth={1.5} />
          </div>
          <div className="absolute top-[15%] right-[8%] opacity-[0.08] dark:opacity-[0.06] text-primary">
            <Hexagon size={160} strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-[15%] right-[10%] opacity-[0.08] dark:opacity-[0.06] text-primary">
            <Box size={150} strokeWidth={1.5} />
          </div>
          <div className="absolute top-[45%] left-[80%] opacity-[0.08] dark:opacity-[0.06] text-primary">
            <Fingerprint size={170} strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-[5%] left-[30%] opacity-[0.08] dark:opacity-[0.06] text-primary">
            <Lock size={120} strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="p-8 pb-6 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="mx-auto mb-6 flex justify-center">
             <Logo className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Choose an account</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            to continue to <span className="font-bold text-primary dark:text-primary-foreground">{targetHost}</span>
          </p>
        </div>

        {/* Auth Error */}
        {authError && (
            <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{authError}</p>
            </div>
        )}

        {/* Account List */}
        <div className="p-2">
          {accounts.map(account => (
            <div 
              key={account.id}
              onClick={() => handleAccountSelect(account)}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl cursor-pointer transition-colors group relative"
            >
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center text-lg font-semibold text-slate-600 dark:text-slate-300">
                {account.avatar_url ? (
                  <img src={account.avatar_url} alt={account.email} className="w-full h-full object-cover" />
                ) : (
                  account.email.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {account.full_name || account.email.split('@')[0]}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {account.email}
                </p>
              </div>
              <div className="w-8 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
              
              {/* Sign out button */}
              <button
                onClick={(e) => handleSignOutAccount(e, account.id)}
                className="absolute right-12 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Remove account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ))}

          <div className="h-px bg-primary/10 dark:bg-white/5 my-3 mx-4" />

          {/* Add Account Button */}
          <div 
            onClick={handleAddAccount}
            className="flex items-center gap-4 p-4 mx-2 mb-2 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-2xl cursor-pointer transition-colors text-slate-700 dark:text-slate-300 group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-primary/30 dark:border-primary/50 flex items-center justify-center shrink-0 group-hover:border-primary/60 transition-colors">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 font-semibold text-sm group-hover:text-primary transition-colors">
              Use another account
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-5 bg-slate-50 dark:bg-[#0B1120] border-t border-slate-100 dark:border-slate-800 text-center">
           <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
             Secure authentication by Optavel ID
           </p>
        </div>
      </div>
    </div>
  );
}
