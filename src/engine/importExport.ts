import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import type { VibeNote } from '@/types';

export function exportToJson(prompts: VibeNote[]): string {
  return JSON.stringify(
    {
      version: 1,
      type: 'backup',
      exportedAt: new Date().toISOString(),
      count: prompts.length,
      prompts,
    },
    null,
    2
  );
}

export function exportPromptToVibe(prompt: VibeNote): string {
  const slug = prompt.title
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  return JSON.stringify(
    {
      version: 1,
      type: 'prompt',
      exportedAt: new Date().toISOString(),
      prompt: {
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        category: prompt.category,
        platform: prompt.platform,
        tags: prompt.tags,
        variables: prompt.variables,
      },
    },
    null,
    2
  );
}

export function parseImportJson(jsonString: string): { type: 'backup' | 'prompt'; prompts: Partial<VibeNote>[] } {
  const data = JSON.parse(jsonString);

  // Single prompt format (.vibe)
  if (data.type === 'prompt' && data.prompt) {
    return { type: 'prompt', prompts: [data.prompt] };
  }

  // Backup format
  if (data.prompts && Array.isArray(data.prompts)) {
    return { type: 'backup', prompts: data.prompts };
  }

  // Raw array
  if (Array.isArray(data)) {
    return { type: 'backup', prompts: data };
  }

  // Plain text or unknown format - treat as single prompt content
  throw new Error('Invalid import format');
}

export async function shareExport(prompts: VibeNote[]): Promise<void> {
  const json = exportToJson(prompts);
  const date = new Date().toISOString().split('T')[0];
  const filename = `backup-${date}.vibe`;
  const file = new File(Paths.cache, filename);

  file.write(json);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Vibe Backup',
    });
  }
}

export async function sharePromptFile(prompt: VibeNote, _includeAudio: boolean = false): Promise<void> {
  const finalData = exportPromptToVibe(prompt);
  const slug = prompt.title
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  const filename = `${slug}.vibe`;
  const file = new File(Paths.cache, filename);

  file.write(finalData);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Share Vibe Prompt',
    });
  }
}

export async function pickAndReadFile(): Promise<{ content: string; name: string } | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', 'text/markdown', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    const file = new File(asset.uri);
    const content = await file.text();
    return { content, name: asset.name || 'unknown' };
  } catch (e) {
    console.error('File pick error:', e);
    return null;
  }
}
