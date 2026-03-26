export type PromptCategory =
  | 'image'
  | 'video'
  | 'code'
  | 'writing'
  | 'marketing'
  | 'business'
  | 'music'
  | 'education'
  | 'other'
  | (string & {});

export type AIPlatform =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'midjourney'
  | 'dalle'
  | 'stable_diffusion'
  | 'sora'
  | 'runway'
  | 'kling'
  | 'copilot'
  | 'cursor'
  | 'v0'
  | 'lovable'
  | 'other'
  | (string & {});

export interface VariableDefinition {
  name: string;
  label?: string;
  type: 'text' | 'select';
  defaultValue?: string;
  options?: string[];
  recentValues: string[];
}

export interface VibeNote {
  id: string;
  title: string;
  content: string;
  description?: string;
  category: PromptCategory;
  platform: AIPlatform;
  tags: string[];
  folderId?: string;
  variables: VariableDefinition[];
  isFavorite: boolean;
  isPinned: boolean;
  usageCount: number;
  lastUsedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export type ScreenName =
  | 'Home'
  | 'Favorites'
  | 'CreatePrompt'
  | 'EditPrompt'
  | 'PromptDetail'
  | 'Settings'
  | 'ManageCategories'
  | 'ManagePlatforms'
  | 'AISettings'
  | 'AIAssistant';

export interface NavigationParams {
  promptId?: string;
}
