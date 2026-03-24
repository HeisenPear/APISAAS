import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fr.apigo.app',
  appName: 'APIGO',
  webDir: '.output/public',
  server: {
    // Pour le développement, pointe vers le dev server Nuxt
    // À commenter pour la production
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#F5A623',
      sound: 'beep.wav',
    },
    Camera: {
      permissions: {
        camera: 'Pour photographier vos ruches',
        photos: 'Pour accéder à vos photos existantes',
      },
    },
    Geolocation: {
      permissions: {
        location: 'Pour géolocaliser vos ruchers',
      },
    },
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#FAFAF8',
  },
  android: {
    backgroundColor: '#FAFAF8',
    allowMixedContent: false,
  },
};

export default config;
