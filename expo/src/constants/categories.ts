import { PromptCategory } from '@/types';

export interface CategoryItem {
  value: PromptCategory;
  label: string;
  labelAr: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryItem[] = [
  { value: 'image', label: 'Images', labelAr: 'صور', icon: 'image', color: '#E91E63' },
  { value: 'video', label: 'Video', labelAr: 'فيديو', icon: 'videocam', color: '#9C27B0' },
  { value: 'code', label: 'Code', labelAr: 'برمجة', icon: 'code-slash', color: '#2196F3' },
  { value: 'writing', label: 'Writing', labelAr: 'كتابة', icon: 'create', color: '#4CAF50' },
  { value: 'marketing', label: 'Marketing', labelAr: 'تسويق', icon: 'megaphone', color: '#FF9800' },
  { value: 'business', label: 'Business', labelAr: 'أعمال', icon: 'briefcase', color: '#607D8B' },
  { value: 'music', label: 'Music', labelAr: 'موسيقى', icon: 'musical-notes', color: '#F44336' },
  { value: 'education', label: 'Education', labelAr: 'تعليم', icon: 'school', color: '#00BCD4' },
  { value: 'other', label: 'Other', labelAr: 'أخرى', icon: 'apps', color: '#795548' },
];
