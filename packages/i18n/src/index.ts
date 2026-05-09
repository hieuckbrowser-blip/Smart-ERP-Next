import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viCommon from './locales/vi/common.json';
import enCommon from './locales/en/common.json';

export const resources = {
  vi: { common: viCommon },
  en: { common: enCommon },
} as const;

export type Language = keyof typeof resources;
export type Namespace = keyof (typeof resources)[Language];

export const defaultNS = 'common';
export const fallbackLng: Language = 'vi';

export const initI18n = (lang: Language = fallbackLng) => {
  return i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng,
    ns: [defaultNS],
    defaultNS,
    interpolation: {
      escapeValue: false,
    },
  });
};

export { i18n };

// Helper hook wrappers for React components
export const getTranslation = (key: string, lang: Language = fallbackLng): string => {
  const ns = defaultNS;
  const resource = resources[lang]?.[ns as keyof typeof resources[typeof lang]];
  if (resource && typeof resource === 'object' && key in resource) {
    return (resource as Record<string, string>)[key];
  }
  return key;
};
