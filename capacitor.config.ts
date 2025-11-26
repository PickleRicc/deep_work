import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yinsen.app',
  appName: 'Yinsen',
  webDir: 'public',  // Placeholder - in production, deploy Next.js separately
  server: {
    // Development: Points to Next.js dev server on local network
    url: 'http://192.168.5.30:3000',
    cleartext: true,
    androidScheme: 'https'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000"
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000"
    }
  }
};

export default config;

