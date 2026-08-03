/**
 * Utility helper for robust Google OIDC OAuth authentication across all Optavel products.
 */

export async function initiateGoogleOAuth(continueUrlOverride = null) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google Client ID (VITE_GOOGLE_CLIENT_ID) is not configured.");
  }

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Determine standard callback endpoint
  let redirectUriBase = 'https://account.optavel.com/auth/google-callback';
  if (isLocalhost) {
    const port = window.location.port ? `:${window.location.port}` : '';
    redirectUriBase = `${window.location.protocol}//account.localhost${port}/auth/google-callback`;
  }

  const redirectUri = encodeURIComponent(redirectUriBase);

  // Generate random raw nonce
  const rawNonce =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  // Compute SHA-256 hash of nonce for Google
  const encoder = new TextEncoder();
  const data = encoder.encode(rawNonce);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Save raw nonce in sessionStorage so GoogleCallback can retrieve it reliably
  try {
    sessionStorage.setItem('optavel_google_raw_nonce', rawNonce);
  } catch (e) {
    console.warn("Could not save nonce to sessionStorage:", e);
  }

  const searchParams = new URLSearchParams(window.location.search);
  const continueParam = continueUrlOverride || searchParams.get('continue') || searchParams.get('redirect') || '/';
  
  // Build full target destination URL
  let targetContinueUrl = continueParam;
  if (!continueParam.startsWith('http://') && !continueParam.startsWith('https://')) {
    targetContinueUrl = `${window.location.origin}${continueParam.startsWith('/') ? '' : '/'}${continueParam}`;
  }

  const stateObj = {
    continue: targetContinueUrl,
    nonce: rawNonce,
    origin: window.location.origin,
  };

  const state = encodeURIComponent(JSON.stringify(stateObj));

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=openid%20email%20profile&state=${state}&nonce=${hashedNonce}`;

  return googleAuthUrl;
}
