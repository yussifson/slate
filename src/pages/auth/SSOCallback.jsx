import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { useTranslation } from "react-i18next";
import { getSubdomainAndBase } from "@/lib/domainUtils";

export default function SSOCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      // The tokens are usually sent in the hash fragment (#access_token=...) by Supabase Implicit Flow
      // But some SSO redirects might pass them as query parameters (?sso_token=... or ?access_token=...)
      const rawSearch = window.location.search;
      const rawHash = window.location.hash;
      const hashParams = new URLSearchParams(rawHash.substring(1));
      const searchParams = new URLSearchParams(rawSearch);
      
      const accessToken = hashParams.get("access_token") || searchParams.get("sso_token") || searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("sso_refresh") || searchParams.get("refresh_token");

      if (!accessToken || !refreshToken) {
        console.error("Missing tokens. Search:", rawSearch, "Hash:", rawHash);
        setError("Invalid SSO Payload. Missing security tokens.");
        return;
      }

      try {
        // Establish the local session for this specific subdomain
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.warn("[SSOCallback] setSession failed, injecting tokens directly into local storage as fallback:", sessionError.message);
          
          try {
             // Fallback: manually inject tokens so AuthContext picks them up on reload
             const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
             const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
             localStorage.setItem(storageKey, JSON.stringify({
                 access_token: accessToken,
                 refresh_token: refreshToken,
                 user: null // AuthContext will fetch the user on next load
             }));
          } catch (storageErr) {
             console.error("Failed to write to local storage", storageErr);
             throw sessionError; // Throw original error if fallback also fails
          }
        }

        // Check if user has a company
        const userId = sessionData?.session?.user?.id;
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', userId).single();
          if (!profile?.company_id && !sessionData?.session?.user?.user_metadata?.company_id) {
             navigate("/signup", { replace: true });
             return;
          }

          // Strict Multi-tenant boundary check: enforce subdomain isolation
          if (profile?.company_id) {
             const { currentSubdomain } = getSubdomainAndBase();
             if (currentSubdomain) {
                const { data: company } = await supabase.from('companies').select('name, subdomain, custom_domain').eq('id', profile.company_id).single();
                const companySubdomain = company?.subdomain || company?.custom_domain || company?.name?.toLowerCase().replace(/[^a-z0-9-]/g, '');
                
                if (companySubdomain && companySubdomain !== currentSubdomain) {
                   // User is trying to access another company's subdomain
                   await supabase.auth.signOut();
                   setError(`You are not authorized to access the workspace '${currentSubdomain}'.`);
                   return;
                }
             }
          }
        }

        // Clear the URL hash for security so it isn't copied/pasted, and redirect to dashboard
        const continueUrl = searchParams.get("continue");
        navigate(continueUrl || "/", { replace: true });
        
      } catch (err) {
        console.error("SSO Callback Error:", err);
        setError(err.message || "Failed to establish local session.");
      }
    };

    processCallback();
  }, [location, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 max-w-md w-full bg-card rounded-2xl shadow-xl border border-destructive/20 text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive font-bold text-xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Login Failed</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-6 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <OrbitLoader size="lg" />
      <p className="text-sm text-muted-foreground font-medium animate-pulse">
        {t("finalizing_login", "Finalizing secure login...")}
      </p>
    </div>
  );
}
