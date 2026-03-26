import { create } from 'zustand';
import type { VibeNote, PromptCategory, AIPlatform } from '@/types';
import { getDatabase } from '@/database/connection';
import * as queries from '@/database/queries';
import { extractVariables } from '@/engine/variableParser';
import { generateId } from '@/utils/id';

interface PromptState {
  prompts: VibeNote[];
  isLoading: boolean;
  searchQuery: string;
  activeCategory: PromptCategory | null;
  activePlatform: AIPlatform | null;

  loadPrompts: () => void;
  addPrompt: (data: {
    title: string;
    content: string;
    description?: string;
    category: PromptCategory;
    platform: AIPlatform;
    tags: string[];
  }) => string;
  updatePrompt: (id: string, data: Partial<VibeNote>) => void;
  deletePrompt: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePin: (id: string) => void;
  incrementUsage: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setActiveCategory: (c: PromptCategory | null) => void;
  setActivePlatform: (p: AIPlatform | null) => void;
  getPromptById: (id: string) => VibeNote | null;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  isLoading: false,
  searchQuery: '',
  activeCategory: null,
  activePlatform: null,

  loadPrompts: () => {
    set({ isLoading: true });
    try {
      const db = getDatabase();
      const { searchQuery, activeCategory, activePlatform } = get();
      const prompts = queries.getAllPrompts(db, {
        category: activeCategory,
        platform: activePlatform,
        search: searchQuery || undefined,
      });
      set({ prompts, isLoading: false });
    } catch (e) {
      console.error('Failed to load prompts:', e);
      set({ isLoading: false });
    }
  },

  addPrompt: (data) => {
    const db = getDatabase();
    const now = Date.now();
    const id = generateId();
    const variables = extractVariables(data.content);
    const prompt: Omit<VibeNote, 'usageCount' | 'lastUsedAt'> = {
      id,
      title: data.title,
      content: data.content,
      description: data.description,
      category: data.category,
      platform: data.platform,
      tags: data.tags,
      variables,
      isFavorite: false,
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    };
    queries.insertPrompt(db, prompt);
    get().loadPrompts();
    return id;
  },

  updatePrompt: (id, data) => {
    const db = getDatabase();
    if (data.content) {
      data.variables = extractVariables(data.content);
    }
    queries.updatePrompt(db, id, data);
    get().loadPrompts();
  },

  deletePrompt: (id) => {
    const db = getDatabase();
    queries.deletePrompt(db, id);
    get().loadPrompts();
  },

  toggleFavorite: (id) => {
    const db = getDatabase();
    queries.toggleFavorite(db, id);
    get().loadPrompts();
  },

  togglePin: (id) => {
    const db = getDatabase();
    queries.togglePin(db, id);
    get().loadPrompts();
  },

  incrementUsage: (id) => {
    const db = getDatabase();
    queries.incrementUsage(db, id);
    get().loadPrompts();
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q });
    get().loadPrompts();
  },

  setActiveCategory: (c) => {
    set({ activeCategory: c });
    get().loadPrompts();
  },

  setActivePlatform: (p) => {
    set({ activePlatform: p });
    get().loadPrompts();
  },

  getPromptById: (id) => {
    const db = getDatabase();
    return queries.getPromptById(db, id);
  },
}));
