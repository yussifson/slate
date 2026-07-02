# Fix Mobile Onboarding Routing & Redesign Splash Screens

## User Review Required
No major architectural changes, but this plan will significantly alter how mobile web and native app users experience the first-time onboarding.

## Proposed Changes

### 1. Routing Logic Changes (App.jsx, Login.jsx, SignUp.jsx)
- **App.jsx**: Update `isBaseDomain` logic so that `currentSubdomain === null` is the ONLY condition. This ensures that opening the native app or PWA will render the Marketing Pages by default, exactly as requested.
- **Login.jsx & SignUp.jsx**: Currently, the splash screens are gated behind `isNativeApp`. I will change this to an `isMobileDevice` check (checking `window.innerWidth < 768` or `userAgent` for mobile) so that ANY mobile user (web or native) who taps "Login" or "Sign Up" for the first time will see the Splash screens.

### 2. NativeOnboarding.jsx (Splash Screens Redesign)
- **Visual Overhaul**: Remove the inconsistent pastel gradients. I will implement a sleek, modern Glassmorphism design that utilizes the app's `primary` color theme natively.
- **Premium Animations**: Add better Framer Motion entry animations, smooth slide transitions, and micro-interactions on the pagination dots.
- **Typography & Layout**: Increase the prominence of the icons/visuals, use premium typography with tighter tracking, and ensure the UI feels like a top-tier fintech/SaaS mobile app.

## Verification Plan
1. Check `App.jsx` to ensure native/mobile users see the marketing layout by default.
2. Check `Login.jsx` to ensure mobile users are routed to `/welcome` on first tap.
3. Validate the `NativeOnboarding` UI in the browser to ensure it looks premium and professional.
