import React, { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { Logo } from "@/components/ui/Logo";

export default function GoogleCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const idToken = hashParams.get('id_token');
        const stateUrl = hashParams.get('state');
        const errorParam = hashParams.get('error');

        if (errorParam) {
          throw new Error(`Google returned an error: ${errorParam}`);
        }

        if (!idToken) {
          throw new Error('No ID token received from Google.');
        }

        let stateObj = null;
        let continueUrl = '/';
        let nonce = undefined;
        
        // Try retrieving raw nonce from sessionStorage first
        try {
          const storedNonce = sessionStorage.getItem('optavel_google_raw_nonce');
          if (storedNonce) {
            nonce = storedNonce;
            sessionStorage.removeItem('optavel_google_raw_nonce');
          }
        } catch (e) {
          console.warn("Could not read stored raw nonce:", e);
        }

        if (stateUrl) {
          try {
            stateObj = JSON.parse(decodeURIComponent(stateUrl));
            continueUrl = stateObj.continue || '/';
            if (!nonce) nonce = stateObj.nonce;
          } catch (e) {
            continueUrl = decodeURIComponent(stateUrl);
          }
        }

        // Sign in to Supabase using the ID token and nonce
        const { data, error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
          nonce: nonce,
        });

        if (signInError) throw signInError;

        // Redirect back to the initiating application or URL passing session tokens
        if (data?.session) {
          const hash = `#access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`;
          const separator = continueUrl.includes('#') ? '&' : '#';
          window.location.href = `${continueUrl}${separator}access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`;
        } else {
          window.location.href = continueUrl;
        }

      } catch (err) {
        console.error("[GoogleCallback] Error:", err);
        setError(err.message);
      }
    };

    handleGoogleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="p-8 max-w-md w-full bg-card rounded-2xl shadow-xl border border-destructive/20 text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive font-bold text-xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Google Authentication Failed</h2>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-semibold"
          >
            Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-background p-4 relative">
      <div className="w-full max-w-md bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-200 dark:border-border overflow-hidden text-center p-12">
        <Logo className="w-12 h-12 mx-auto mb-6" />
        <OrbitLoader size="lg" />
        <p className="mt-6 text-sm text-slate-500 dark:text-muted-foreground font-medium animate-pulse">
          Completing Google Sign In...
        </p>
      </div>
    </div>
  );
}

