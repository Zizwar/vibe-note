import { AIPlatform } from '@/types';

export interface PlatformItem {
  value: AIPlatform;
  label: string;
  icon: string;
  color: string;
}

export const PLATFORMS: PlatformItem[] = [
  { value: 'chatgpt', label: 'ChatGPT', icon: 'chatbubble-ellipses', color: '#10A37F' },
  { value: 'claude', label: 'Claude', icon: 'sparkles', color: '#D4A574' },
  { value: 'gemini', label: 'Gemini', icon: 'diamond', color: '#4285F4' },
  { value: 'midjourney', label: 'Midjourney', icon: 'color-palette', color: '#0B3D91' },
  { value: 'dalle', label: 'DALL-E', icon: 'brush', color: '#10A37F' },
  { value: 'stable_diffusion', label: 'Stable Diffusion', icon: 'flame', color: '#A855F7' },
  { value: 'sora', label: 'Sora', icon: 'film', color: '#000000' },
  { value: 'runway', label: 'Runway', icon: 'play-circle', color: '#6366F1' },
  { value: 'kling', label: 'Kling', icon: 'videocam', color: '#FF6B6B' },
  { value: 'copilot', label: 'Copilot', icon: 'logo-github', color: '#24292E' },
  { value: 'cursor', label: 'Cursor', icon: 'terminal', color: '#7C3AED' },
  { value: 'v0', label: 'v0', icon: 'globe', color: '#000000' },
  { value: 'lovable', label: 'Lovable', icon: 'heart', color: '#EC4899' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];
