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

/**
 * Kind of library item:
 * - prompt: a reusable prompt template (may contain {{variables}})
 * - note: a freeform note (ideas, snippets, references)
 * - context: a reusable context block injected as system context into chats
 */
export type ItemKind = 'prompt' | 'note' | 'context';

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
  kind: ItemKind;
  title: string;
  content: string;
  description?: string;
  category: PromptCategory;
  platform: AIPlatform;
  tags: string[];
  folderId?: string;
  variables: VariableDefinition[];
  /** Ids of prompts linked to this one (composition / next-step chains) */
  linkedIds: string[];
  /** Ids of context items attached to this prompt (injected when run in chat) */
  contextIds: string[];
  isFavorite: boolean;
  isPinned: boolean;
  usageCount: number;
  lastUsedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatSession {
  id: string;
  title: string;
  /** Provider id active when the session was created (informational) */
  providerId?: string;
  model?: string;
  /** Context items injected as system context for this conversation */
  contextIds: string[];
  isPinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  /** When a saved prompt produced this user message, its id (drives next-step chains) */
  promptId?: string;
  createdAt: number;
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
  /** Pre-fills the AI Assistant chat input when navigating to the AIAssistant screen */
  seedPrompt?: string;
  /** Id of the prompt that produced seedPrompt (enables chains + attached contexts) */
  seedPromptId?: string;
  /** Unique per-navigation token so a restored history entry never re-runs the seed */
  seedNonce?: string;
  /** Open a specific chat session in the AI Assistant */
  sessionId?: string;
  /** Pre-fill CreatePrompt fields (e.g. saving a chat reply as a prompt/note) */
  prefillTitle?: string;
  prefillContent?: string;
  prefillKind?: string;
}
