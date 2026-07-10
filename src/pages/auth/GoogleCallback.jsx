import React, { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { OrbitLoader } from "@/components/ui/orbit-loader";
import { AlertCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function GoogleCallback() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Google OIDC implicit flow puts tokens in the URL hash, e.g. #id_token=...&state=...
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

        // Sign in to Supabase using the ID token
        const { data, error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (signInError) throw signInError;

        // Redirect back to the subdomain that initiated the request
        if (stateUrl) {
          window.location.href = stateUrl;
        } else {
          // Fallback if no state was provided
          window.location.href = '/';
        }

      } catch (err) {
        setError(err.message);
      }
    };

    handleGoogleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 max-w-md w-full bg-card rounded-2xl shadow-xl border border-destructive/20 text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-destructive font-bold text-xl">!</span>
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-6 w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 relative">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center p-12">
        <Logo className="w-12 h-12 mx-auto mb-6" />
        <OrbitLoader size="lg" />
        <p className="mt-6 text-sm text-slate-500 font-medium animate-pulse">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
