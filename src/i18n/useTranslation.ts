import { create } from 'zustand';
import { translations } from './translations';

type Language = 'fr' | 'en' | 'es';

interface I18nStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  language: 'fr',
  setLanguage: (lang) => {
    set({ language: lang });
    // Persist language preference
    localStorage.setItem('app-language', lang);
  },
  t: (key) => {
    const { language } = get();
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        return key;
      }
    }
    
    return value as string;
  }
}));