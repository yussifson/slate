import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { useTranslation } from "react-i18next";

export default function SSOGateway() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUri = searchParams.get("redirect_uri");
  const [error, setError] = useState(null);

  useEffect(() => {
    const processSSO = async () => {
      if (!redirectUri) {
        setError("Missing redirect_uri parameter");
        return;
      }

      // 1. Check if user is logged into the root account (account.optavel.com)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // Not logged in! Redirect to login, but tell Login to send them BACK here after.
        navigate(`/login?continue=${encodeURIComponent(`/sso?redirect_uri=${redirectUri}`)}`, { replace: true });
        return;
      }

      // 2. User IS logged in! We have the session. 
      // We must pass the access_token and refresh_token securely via the URL hash fragment.
      // (The hash fragment is NOT sent to the server in HTTP requests, making it safe for client-side routing).
      const hash = `#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
      
      // Basic security check: ensure the redirect is to an optavel.com domain or localhost
      try {
        const url = new URL(redirectUri);
        if (!url.hostname.endsWith('optavel.com') && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          throw new Error("Invalid redirect URI domain");
        }
        
        // Append the hash and redirect!
        window.location.href = `${redirectUri}${hash}`;
      } catch (err) {
        setError("Invalid redirect_uri format or unauthorized domain.");
      }
    };

    processSSO();
  }, [navigate, redirectUri]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 max-w-md w-full bg-card rounded-2xl shadow-xl border border-destructive/20 text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive font-bold text-xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">SSO Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <OrbitLoader size="lg" />
      <p className="text-sm text-muted-foreground font-medium animate-pulse">
        {t("authenticating_sso", "Authenticating with Optavel Account...")}
      </p>
    </div>
  );
}
