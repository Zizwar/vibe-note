import React from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import HomeScreen from '@/screens/HomeScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import CreatePromptScreen from '@/screens/CreatePromptScreen';
import PromptDetailScreen from '@/screens/PromptDetailScreen';
import SettingsScreen from '@/screens/SettingsScreen';

export default function Navigator() {
  const currentScreen = useNavigationStore(s => s.currentScreen);
  const params = useNavigationStore(s => s.params);

  switch (currentScreen) {
    case 'Home':
      return <HomeScreen />;
    case 'Favorites':
      return <FavoritesScreen />;
    case 'CreatePrompt':
      return <CreatePromptScreen />;
    case 'EditPrompt':
      return <CreatePromptScreen promptId={params.promptId} />;
    case 'PromptDetail':
      return <PromptDetailScreen promptId={params.promptId} />;
    case 'Settings':
      return <SettingsScreen />;
    default:
      return <HomeScreen />;
  }
}
