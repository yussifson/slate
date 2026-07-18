import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.slate.slate',
  appName: 'CliPad',
  webDir: 'dist',
  server: {
    url: 'https://clipad.optavel.com',
    cleartext: true
  },
  plugins: {
    CapacitorUpdater: {
      version: '0.0.0',
      appId: 'com.slate.slate',
      autoUpdate: 'always',
      autoSplashscreen: true
    },
    SplashScreen: {
      launchAutoHide: false
    }
  }
};

export default config;
