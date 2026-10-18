import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.remon.marketplace',
  appName: 'Remon',
  webDir: 'www',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
