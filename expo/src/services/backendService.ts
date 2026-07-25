import type { VibeNote } from '@/types';

// Default backend server URL (can be changed in app settings or env)
export const DEFAULT_BACKEND_URL = 'https://test.10rg.com';

export interface PublishResult {
  shortId: string;
  shortUrl: string;
}

export async function publishPromptToWeb(
  prompt: VibeNote,
  isPublic: boolean = true,
  serverUrl: string = DEFAULT_BACKEND_URL
): Promise<PublishResult> {
  const url = `${serverUrl.replace(/\/$/, '')}/api/prompts`;

  const payload = {
    title: prompt.title,
    kind: prompt.kind,
    content: prompt.content,
    description: prompt.description || '',
    category: prompt.category,
    platform: prompt.platform,
    tags: prompt.tags,
    variables: prompt.variables,
    isPublic: isPublic,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to publish prompt (${res.status})`);
  }

  const data = await res.json();
  return {
    shortId: data.shortId,
    shortUrl: data.shortUrl,
  };
}

export async function fetchRemotePrompt(
  shortId: string,
  serverUrl: string = DEFAULT_BACKEND_URL
): Promise<Partial<VibeNote> | null> {
  try {
    const url = `${serverUrl.replace(/\/$/, '')}/api/prompts/${shortId}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title,
      kind: data.kind || 'prompt',
      content: data.content,
      description: data.description,
      category: data.category,
      platform: data.platform,
      tags: data.tags || [],
      variables: data.variables || [],
    };
  } catch (e) {
    console.error('Error fetching remote prompt:', e);
    return null;
  }
}
