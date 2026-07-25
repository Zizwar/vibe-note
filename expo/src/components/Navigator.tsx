import React from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import HomeScreen from '@/screens/HomeScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import CreatePromptScreen from '@/screens/CreatePromptScreen';
import PromptDetailScreen from '@/screens/PromptDetailScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import ManageCategoriesScreen from '@/screens/ManageCategoriesScreen';
import ManagePlatformsScreen from '@/screens/ManagePlatformsScreen';
import AISettingsScreen from '@/screens/AISettingsScreen';
import AIAssistantScreen from '@/screens/AIAssistantScreen';

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
    case 'ManageCategories':
      return <ManageCategoriesScreen />;
    case 'ManagePlatforms':
      return <ManagePlatformsScreen />;
    case 'AISettings':
      return <AISettingsScreen />;
    case 'AIAssistant':
      return <AIAssistantScreen />;
    default:
      return <HomeScreen />;
  }
}
