import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viCommon from './locales/vi/common.json';
import enCommon from './locales/en/common.json';

export type Language = 'vi' | 'en';

const resources = {
  vi: { common: viCommon },
  en: { common: enCommon },
} as const;

export async function initI18n(locale: Language = 'vi') {
  if (i18n.isInitialized) return i18n;
  await i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: 'vi',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });
  return i18n;
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'vi',
    fallbackLng: 'vi',
    ns: ['common'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
