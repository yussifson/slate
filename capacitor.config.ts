import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.optavel.clipad',
  appName: 'CliPad',
  webDir: 'dist',
  plugins: {
    CapacitorUpdater: {
      version: '0.0.0',
      appId: 'com.optavel.clipad',
      autoUpdate: 'always',
      autoSplashscreen: true
    },
    SplashScreen: {
      launchAutoHide: false
    }
  }
};

export default config;
