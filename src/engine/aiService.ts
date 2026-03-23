import { useSettingsStore, AIProviderConfig } from '@/stores/settingsStore';
import { CATEGORIES } from '@/constants/categories';
import { PLATFORMS } from '@/constants/platforms';

interface AIResponse {
  text: string;
}

function getActiveProvider(): AIProviderConfig | null {
  const state = useSettingsStore.getState();
  const activeId = state.activeAIProvider;
  if (!activeId) return null;
  const provider = state.aiProviders.find(p => p.id === activeId);
  if (!provider || !provider.apiKey) return null;
  return provider;
}

async function callGemini(provider: AIProviderConfig, prompt: string): Promise<AIResponse> {
  const url = `${provider.baseUrl}/models/${provider.model}:generateContent?key=${provider.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text };
}

async function callOpenAICompatible(provider: AIProviderConfig, prompt: string): Promise<AIResponse> {
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return { text };
}

export async function callAI(prompt: string): Promise<string> {
  const provider = getActiveProvider();
  if (!provider) throw new Error('No active AI provider configured');

  let response: AIResponse;
  if (provider.id === 'gemini') {
    response = await callGemini(provider, prompt);
  } else {
    response = await callOpenAICompatible(provider, prompt);
  }
  return response.text;
}

export async function testAIConnection(): Promise<boolean> {
  try {
    const result = await callAI('Say "ok" in one word.');
    return result.length > 0;
  } catch {
    return false;
  }
}

export function isAIConfigured(): boolean {
  return getActiveProvider() !== null;
}

const categoryValues = CATEGORIES.map(c => c.value).join(', ');
const platformValues = PLATFORMS.map(p => p.value).join(', ');

export async function analyzePrompt(promptContent: string): Promise<{
  quality: number;
  suggestions: string[];
  analysis: string;
}> {
  const systemPrompt = `You are a prompt engineering expert. Analyze the following prompt and return a JSON object with:
- "quality": a score from 1-10
- "suggestions": an array of improvement suggestions (max 5)
- "analysis": a brief analysis of the prompt (2-3 sentences)

Return ONLY valid JSON, no markdown, no code blocks.

Prompt to analyze:
${promptContent}`;

  const result = await callAI(systemPrompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { quality: 5, suggestions: ['Could not parse AI response'], analysis: result.slice(0, 200) };
  }
}

export async function improvePrompt(promptContent: string): Promise<string> {
  const systemPrompt = `You are a prompt engineering expert. Improve the following prompt to make it more effective, clear, and detailed. Keep the same intent but make it better. Return ONLY the improved prompt text, nothing else.

Original prompt:
${promptContent}`;

  return await callAI(systemPrompt);
}

export async function smartImportPrompt(rawPrompt: string): Promise<{
  title: string;
  content: string;
  description: string;
  category: string;
  platform: string;
  tags: string[];
  variables: string[];
}> {
  const state = useSettingsStore.getState();
  const customCats = state.customCategories.map(c => c.value).join(', ');
  const customPlats = state.customPlatforms.map(p => p.value).join(', ');

  const systemPrompt = `You are a prompt organization expert. Analyze the following raw prompt and return a JSON object to organize it. Detect variables (words that should be customizable) and wrap them in {{variable_name}} syntax.

Available categories: ${categoryValues}${customCats ? ', ' + customCats : ''}
Available platforms: ${platformValues}${customPlats ? ', ' + customPlats : ''}

Return ONLY valid JSON with these fields:
- "title": a concise title (max 60 chars)
- "content": the prompt with {{variables}} inserted where appropriate
- "description": a brief description of what this prompt does
- "category": one of the available categories
- "platform": one of the available platforms (best guess)
- "tags": array of relevant tags (max 5)
- "variables": array of detected variable names

Raw prompt:
${rawPrompt}`;

  const result = await callAI(systemPrompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      title: rawPrompt.slice(0, 50),
      content: rawPrompt,
      description: '',
      category: 'other',
      platform: 'chatgpt',
      tags: [],
      variables: [],
    };
  }
}

export async function generatePrompt(userDescription: string): Promise<{
  title: string;
  content: string;
  description: string;
  category: string;
  platform: string;
  tags: string[];
}> {
  const systemPrompt = `You are a prompt engineering expert. Based on the user's description, create a high-quality, effective prompt. Use {{variable_name}} syntax for customizable parts.

Available categories: ${categoryValues}
Available platforms: ${platformValues}

Return ONLY valid JSON with:
- "title": a concise title
- "content": the full prompt with {{variables}}
- "description": what this prompt does
- "category": best matching category
- "platform": best matching platform
- "tags": relevant tags (max 5)

User's request:
${userDescription}`;

  const result = await callAI(systemPrompt);
  try {
    const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      title: 'Generated Prompt',
      content: result,
      description: userDescription,
      category: 'other',
      platform: 'chatgpt',
      tags: [],
    };
  }
}
