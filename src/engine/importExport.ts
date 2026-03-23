import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { ProomyNote } from '@/types';

export function exportToJson(prompts: ProomyNote[]): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      count: prompts.length,
      prompts,
    },
    null,
    2
  );
}

export function parseImportJson(jsonString: string): ProomyNote[] {
  const data = JSON.parse(jsonString);
  if (Array.isArray(data)) return data;
  if (data.prompts && Array.isArray(data.prompts)) return data.prompts;
  throw new Error('Invalid import format');
}

export async function shareExport(prompts: ProomyNote[]): Promise<void> {
  const json = exportToJson(prompts);
  const filename = `proomy-export-${Date.now()}.json`;
  const file = new File(Paths.cache, filename);

  file.write(json);

  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Export Proomy Notes',
    });
  }
}
