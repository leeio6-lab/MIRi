import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ko from './ko.json';
import ja from './ja.json';
import en from './en.json';

const LANGUAGE_KEY = 'miri-language';
const supportedLngs = ['ko', 'ja', 'en'];

const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
const defaultLng = supportedLngs.includes(deviceLocale) ? deviceLocale : 'en';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    ja: { translation: ja },
    en: { translation: en },
  },
  lng: defaultLng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Restore saved language preference
AsyncStorage.getItem(LANGUAGE_KEY).then((saved) => {
  if (saved && supportedLngs.includes(saved) && saved !== i18n.language) {
    i18n.changeLanguage(saved);
  }
});

// Persist language changes
i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LANGUAGE_KEY, lng).catch(() => {});
});

export default i18n;
