import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { useTranslation } from "react-i18next";

export default function SSOCallback() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      // The tokens are sent in the hash fragment: #access_token=...&refresh_token=...
      const hash = location.hash.substring(1);
      const params = new URLSearchParams(hash);
      
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        setError("Invalid SSO Payload. Missing security tokens.");
        return;
      }

      try {
        // Establish the local session for this specific subdomain
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) throw sessionError;

        // Check if user has a company
        const userId = sessionData?.session?.user?.id;
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', userId).single();
          if (!profile?.company_id && !sessionData?.session?.user?.user_metadata?.company_id) {
             navigate("/signup", { replace: true });
             return;
          }
        }

        // Clear the URL hash for security so it isn't copied/pasted, and redirect to dashboard
        navigate("/", { replace: true });
        
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
