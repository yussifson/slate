import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { useTranslation } from "react-i18next";
import { getSavedAccounts, removeAccount } from "@/lib/multiAccountUtils";
import { LogOut, Plus, ChevronRight, AlertCircle, ShieldAlert } from "lucide-react";

export default function SSOGateway() {
  const { t } = useTranslation();
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
        navigate(`/login?continue=${encodeURIComponent(`/sso?redirect_uri=${redirectUri}`)}`, { replace: true });
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
      // 1. Swap active session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: account.access_token,
        refresh_token: account.refresh_token
      });
      
      if (sessionError) {
          // Token might be fully expired or revoked. Force login.
          removeAccount(account.id);
          throw new Error("Session expired. Please log in again.");
      }
      
      // 2. Wait a brief moment for any background token refreshes to apply
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

  const handleAddAccount = () => {
    navigate(`/login?continue=${encodeURIComponent(`/sso?redirect_uri=${redirectUri}`)}`);
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
             <ShieldAlert className="w-8 h-8 text-primary -rotate-3" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Choose an account</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            to continue to <span className="font-semibold text-slate-700 dark:text-slate-300">{targetHost}</span>
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

          <div className="h-px bg-slate-100 dark:border-slate-800 my-2 mx-4" />

          {/* Add Account Button */}
          <div 
            onClick={handleAddAccount}
            className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl cursor-pointer transition-colors text-slate-700 dark:text-slate-300"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="flex-1 font-medium text-sm">
              Use another account
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
           <p className="text-xs text-slate-400">
             Secure authentication by Optavel ID
           </p>
        </div>
      </div>
    </div>
  );
}
