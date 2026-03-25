import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { CategoryItem } from '@/constants/categories';
import type { PlatformItem } from '@/constants/platforms';

export interface AIProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  isActive: boolean;
}

interface SettingsState {
  language: 'en' | 'ar';
  isRTL: boolean;
  isDarkMode: boolean;

  // Custom categories & providers
  customCategories: CategoryItem[];
  customPlatforms: PlatformItem[];

  // AI provider settings
  aiProviders: AIProviderConfig[];
  activeAIProvider: string | null;

  // Actions
  setLanguage: (lang: 'en' | 'ar') => void;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;

  // Custom categories
  addCustomCategory: (cat: CategoryItem) => void;
  updateCustomCategory: (value: string, cat: Partial<CategoryItem>) => void;
  removeCustomCategory: (value: string) => void;

  // Custom platforms
  addCustomPlatform: (plat: PlatformItem) => void;
  updateCustomPlatform: (value: string, plat: Partial<PlatformItem>) => void;
  removeCustomPlatform: (value: string) => void;

  // AI providers
  addAIProvider: (provider: AIProviderConfig) => void;
  updateAIProvider: (id: string, data: Partial<AIProviderConfig>) => void;
  removeAIProvider: (id: string) => void;
  setActiveAIProvider: (id: string | null) => void;
}

const DEFAULT_AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    isActive: false,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    isActive: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    isActive: false,
  },
];

const SETTINGS_KEY = 'proomy_settings';
const AI_PROVIDERS_KEY = 'proomy_ai_providers';
const ACTIVE_PROVIDER_KEY = 'proomy_active_provider';

async function persistSettings(state: Partial<SettingsState>) {
  try {
    const data = {
      language: state.language,
      isDarkMode: state.isDarkMode,
      customCategories: state.customCategories,
      customPlatforms: state.customPlatforms,
    };
    await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to persist settings:', e);
  }
}

async function persistAIProviders(providers: AIProviderConfig[], activeId: string | null) {
  try {
    await SecureStore.setItemAsync(AI_PROVIDERS_KEY, JSON.stringify(providers));
    await SecureStore.setItemAsync(ACTIVE_PROVIDER_KEY, activeId || '');
  } catch (e) {
    console.error('Failed to persist AI providers:', e);
  }
}

export async function loadSettingsFromStorage() {
  try {
    const settingsJson = await SecureStore.getItemAsync(SETTINGS_KEY);
    if (settingsJson) {
      const data = JSON.parse(settingsJson);
      useSettingsStore.setState({
        language: data.language || 'en',
        isRTL: data.language === 'ar',
        isDarkMode: data.isDarkMode || false,
        customCategories: data.customCategories || [],
        customPlatforms: data.customPlatforms || [],
      });
    }

    const providersJson = await SecureStore.getItemAsync(AI_PROVIDERS_KEY);
    if (providersJson) {
      const providers = JSON.parse(providersJson);
      useSettingsStore.setState({ aiProviders: providers });
    }

    const activeId = await SecureStore.getItemAsync(ACTIVE_PROVIDER_KEY);
    if (activeId) {
      useSettingsStore.setState({ activeAIProvider: activeId || null });
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  language: 'en',
  isRTL: false,
  isDarkMode: false,
  customCategories: [],
  customPlatforms: [],
  aiProviders: DEFAULT_AI_PROVIDERS,
  activeAIProvider: null,

  setLanguage: (lang) => {
    set({ language: lang, isRTL: lang === 'ar' });
    persistSettings({ ...get(), language: lang });
  },

  toggleDarkMode: () => {
    const newVal = !get().isDarkMode;
    set({ isDarkMode: newVal });
    persistSettings({ ...get(), isDarkMode: newVal });
  },

  setDarkMode: (val) => {
    set({ isDarkMode: val });
    persistSettings({ ...get(), isDarkMode: val });
  },

  // Custom categories
  addCustomCategory: (cat) => {
    set(s => {
      const updated = { ...s, customCategories: [...s.customCategories, cat] };
      persistSettings(updated);
      return { customCategories: updated.customCategories };
    });
  },
  updateCustomCategory: (value, updates) => {
    set(s => {
      const customCategories = s.customCategories.map(c =>
        c.value === value ? { ...c, ...updates } : c
      );
      persistSettings({ ...s, customCategories });
      return { customCategories };
    });
  },
  removeCustomCategory: (value) => {
    set(s => {
      const customCategories = s.customCategories.filter(c => c.value !== value);
      persistSettings({ ...s, customCategories });
      return { customCategories };
    });
  },

  // Custom platforms
  addCustomPlatform: (plat) => {
    set(s => {
      const customPlatforms = [...s.customPlatforms, plat];
      persistSettings({ ...s, customPlatforms });
      return { customPlatforms };
    });
  },
  updateCustomPlatform: (value, updates) => {
    set(s => {
      const customPlatforms = s.customPlatforms.map(p =>
        p.value === value ? { ...p, ...updates } : p
      );
      persistSettings({ ...s, customPlatforms });
      return { customPlatforms };
    });
  },
  removeCustomPlatform: (value) => {
    set(s => {
      const customPlatforms = s.customPlatforms.filter(p => p.value !== value);
      persistSettings({ ...s, customPlatforms });
      return { customPlatforms };
    });
  },

  // AI providers
  addAIProvider: (provider) => {
    set(s => {
      const aiProviders = [...s.aiProviders, provider];
      persistAIProviders(aiProviders, s.activeAIProvider);
      return { aiProviders };
    });
  },
  updateAIProvider: (id, data) => {
    set(s => {
      const aiProviders = s.aiProviders.map(p =>
        p.id === id ? { ...p, ...data } : p
      );
      persistAIProviders(aiProviders, s.activeAIProvider);
      return { aiProviders };
    });
  },
  removeAIProvider: (id) => {
    set(s => {
      const aiProviders = s.aiProviders.filter(p => p.id !== id);
      const activeAIProvider = s.activeAIProvider === id ? null : s.activeAIProvider;
      persistAIProviders(aiProviders, activeAIProvider);
      return { aiProviders, activeAIProvider };
    });
  },
  setActiveAIProvider: (id) => {
    set({ activeAIProvider: id });
    persistAIProviders(get().aiProviders, id);
  },
}));
