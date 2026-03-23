import { create } from 'zustand';

interface SettingsState {
  language: 'en' | 'ar';
  isRTL: boolean;
  setLanguage: (lang: 'en' | 'ar') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  isRTL: false,

  setLanguage: (lang) => {
    set({ language: lang, isRTL: lang === 'ar' });
  },
}));
