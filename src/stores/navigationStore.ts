import { create } from 'zustand';
import type { ScreenName } from '@/types';

interface HistoryEntry {
  screen: ScreenName;
  params: Record<string, string>;
}

interface NavigationState {
  currentScreen: ScreenName;
  params: Record<string, string>;
  history: HistoryEntry[];
  navigate: (screen: ScreenName, params?: Record<string, string>) => void;
  goBack: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentScreen: 'Home',
  params: {},
  history: [],

  navigate: (screen, params = {}) => {
    const { currentScreen, params: currentParams, history } = get();
    set({
      currentScreen: screen,
      params,
      history: [...history, { screen: currentScreen, params: currentParams }],
    });
  },

  goBack: () => {
    const { history } = get();
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    set({
      currentScreen: prev.screen,
      params: prev.params,
      history: history.slice(0, -1),
    });
  },
}));
