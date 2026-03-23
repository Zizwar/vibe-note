import { create } from 'zustand';
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
    model: 'gemini-2.0-flash',
    isActive: false,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    apiKey: '',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.0-flash-exp:free',
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
  },

  toggleDarkMode: () => {
    set(s => ({ isDarkMode: !s.isDarkMode }));
  },

  setDarkMode: (val) => {
    set({ isDarkMode: val });
  },

  // Custom categories
  addCustomCategory: (cat) => {
    set(s => ({ customCategories: [...s.customCategories, cat] }));
  },
  updateCustomCategory: (value, updates) => {
    set(s => ({
      customCategories: s.customCategories.map(c =>
        c.value === value ? { ...c, ...updates } : c
      ),
    }));
  },
  removeCustomCategory: (value) => {
    set(s => ({
      customCategories: s.customCategories.filter(c => c.value !== value),
    }));
  },

  // Custom platforms
  addCustomPlatform: (plat) => {
    set(s => ({ customPlatforms: [...s.customPlatforms, plat] }));
  },
  updateCustomPlatform: (value, updates) => {
    set(s => ({
      customPlatforms: s.customPlatforms.map(p =>
        p.value === value ? { ...p, ...updates } : p
      ),
    }));
  },
  removeCustomPlatform: (value) => {
    set(s => ({
      customPlatforms: s.customPlatforms.filter(p => p.value !== value),
    }));
  },

  // AI providers
  addAIProvider: (provider) => {
    set(s => ({ aiProviders: [...s.aiProviders, provider] }));
  },
  updateAIProvider: (id, data) => {
    set(s => ({
      aiProviders: s.aiProviders.map(p =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));
  },
  removeAIProvider: (id) => {
    set(s => ({
      aiProviders: s.aiProviders.filter(p => p.id !== id),
      activeAIProvider: s.activeAIProvider === id ? null : s.activeAIProvider,
    }));
  },
  setActiveAIProvider: (id) => {
    set({ activeAIProvider: id });
  },
}));
