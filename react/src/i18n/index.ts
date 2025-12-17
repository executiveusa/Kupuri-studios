import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import commonEn from './locales/en/common.json'
import homeEn from './locales/en/home.json'
import canvasEn from './locales/en/canvas.json'
import chatEn from './locales/en/chat.json'
import settingsEn from './locales/en/settings.json'
import dashboardEn from './locales/en/dashboard.json'

import commonEs from './locales/es-MX/common.json'
import homeEs from './locales/es-MX/home.json'
import canvasEs from './locales/es-MX/canvas.json'
import chatEs from './locales/es-MX/chat.json'
import settingsEs from './locales/es-MX/settings.json'
import dashboardEs from './locales/es-MX/dashboard.json'
import errorEn from './locales/en/errors.json'
import errorEs from './locales/es-MX/errors.json'

const resources = {
  en: {
    common: commonEn,
    home: homeEn,
    canvas: canvasEn,
    chat: chatEn,
    settings: settingsEn,
    dashboard: dashboardEn,
  },
  'es-MX': {
    common: commonEs,
    home: homeEs,
    canvas: canvasEs,
    chat: chatEs,
    settings: settingsEs,
    dashboard: dashboardEs,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'home', 'canvas', 'chat', 'settings', 'error', 'dashboard'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'language',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  })

export default i18n

