import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medvault.app',
  appName: 'MedVault',
  webDir: 'out',
  server: {
    // Allow all iframe embeds in native apps (ChatGPT, Gemini, etc.)
    allowNavigation: [
      'chatgpt.com',
      'gemini.google.com',
      'claude.ai',
      'copilot.microsoft.com',
      'www.perplexity.ai',
      '*.openai.com',
      '*.google.com',
      '*.anthropic.com',
      '*.microsoft.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0c0e14',
      showSpinner: true,
      spinnerColor: '#6c5ce7',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0c0e14',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile',
  },
};

export default config;
