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

async function callOpenAICompatible(provider: AIProviderConfig, prompt: string, messages?: Array<{role: string; content: string}>): Promise<AIResponse> {
  const body: any = {
    model: provider.model,
    temperature: 0.7,
    max_tokens: 2048,
  };
  if (messages) {
    body.messages = messages;
  } else {
    body.messages = [{ role: 'user', content: prompt }];
  }
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
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

export async function callAIChat(messages: Array<{role: string; content: string}>): Promise<string> {
  const provider = getActiveProvider();
  if (!provider) throw new Error('No active AI provider configured');

  if (provider.id === 'gemini') {
    // Gemini uses a flat prompt, concatenate messages
    const prompt = messages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
    const response = await callGemini(provider, prompt);
    return response.text;
  } else {
    const response = await callOpenAICompatible(provider, '', messages);
    return response.text;
  }
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

const VARIABLE_INSTRUCTIONS = `
IMPORTANT - Variable Syntax Rules:
Variables MUST follow this exact syntax:
- {{variable_name}} - Plain text variable (user fills in)
- {{variable_name|default_value}} - Text with a default value
- {{variable_name:option1|option2|option3}} - Dropdown select with options

Examples:
- {{topic}} - user types any topic
- {{language|English}} - defaults to "English"
- {{tone:formal|casual|professional}} - dropdown to pick tone
- {{word_count|500}} - defaults to 500

ALWAYS use snake_case for variable names. ALWAYS use double curly braces.
Do NOT use other formats like {var}, [var], <var>, or %var%.
`;

const categoryValues = CATEGORIES.map(c => c.value).join(', ');
const platformValues = PLATFORMS.map(p => p.value).join(', ');

/** Robustly extracts and parses the first JSON object from an AI response */
function parseAIJson(text: string): any {
  // 1. Try direct parse
  try { return JSON.parse(text.trim()); } catch {}

  // 2. Strip markdown code fences and retry
  const stripped = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/im, '')
    .trim();
  try { return JSON.parse(stripped); } catch {}

  // 3. Extract first balanced JSON object with brace counting
  const start = text.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(text.slice(start, i + 1)); } catch {}
          break;
        }
      }
    }
  }

  throw new Error('Could not parse JSON from AI response');
}

export async function analyzePrompt(promptContent: string): Promise<{
  quality: number;
  suggestions: string[];
  analysis: string;
}> {
  const systemPrompt = `You are a prompt engineering expert. Analyze the following prompt and return a JSON object with:
- "quality": a score from 1-10
- "suggestions": an array of improvement suggestions (max 5)
- "analysis": a brief analysis of the prompt (2-3 sentences)

${VARIABLE_INSTRUCTIONS}

Check if the prompt uses the correct variable syntax. If not, suggest the correct format.

Return ONLY valid JSON, no markdown, no code blocks.

Prompt to analyze:
${promptContent}`;

  const result = await callAI(systemPrompt);
  try {
    return parseAIJson(result);
  } catch {
    return { quality: 5, suggestions: ['Could not parse AI response'], analysis: result.slice(0, 200) };
  }
}

export async function improvePrompt(promptContent: string): Promise<string> {
  const systemPrompt = `You are a prompt engineering expert. Improve the following prompt to make it more effective, clear, and detailed. Keep the same intent but make it better.

${VARIABLE_INSTRUCTIONS}

If the prompt has variables, keep them and ensure they follow the correct syntax. Add more variables where useful.

Return ONLY the improved prompt text, nothing else.

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

  const systemPrompt = `You are a prompt organization expert. Analyze the following raw prompt and return a JSON object to organize it.

${VARIABLE_INSTRUCTIONS}

Detect parts of the prompt that should be customizable and wrap them in the correct variable syntax.

Available categories: ${categoryValues}${customCats ? ', ' + customCats : ''}
Available platforms: ${platformValues}${customPlats ? ', ' + customPlats : ''}

Return ONLY valid JSON with these fields:
- "title": a concise title (max 60 chars)
- "content": the prompt with {{variables}} inserted where appropriate (MUST use {{name}}, {{name|default}}, or {{name:opt1|opt2}} syntax)
- "description": a brief description of what this prompt does
- "category": one of the available categories
- "platform": one of the available platforms (best guess)
- "tags": array of relevant tags (max 5)
- "variables": array of detected variable names

Raw prompt:
${rawPrompt}`;

  const result = await callAI(systemPrompt);
  try {
    return parseAIJson(result);
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
  const systemPrompt = `You are a prompt engineering expert. Based on the user's description, create a high-quality, effective prompt.

${VARIABLE_INSTRUCTIONS}

Use variables for any customizable parts of the prompt.

Available categories: ${categoryValues}
Available platforms: ${platformValues}

Return ONLY valid JSON with:
- "title": a concise title
- "content": the full prompt with {{variables}} using the correct syntax
- "description": what this prompt does
- "category": best matching category
- "platform": best matching platform
- "tags": relevant tags (max 5)

User's request:
${userDescription}`;

  const result = await callAI(systemPrompt);
  try {
    return parseAIJson(result);
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

export async function editPromptWithAI(currentContent: string, editInstructions: string): Promise<string> {
  const systemPrompt = `You are a prompt engineering expert. The user wants to modify an existing prompt.

${VARIABLE_INSTRUCTIONS}

Apply the requested changes to the prompt. Maintain existing variables and their syntax. Add new variables if appropriate based on the edit request.

Return ONLY the modified prompt text, nothing else.

Current prompt:
${currentContent}

Requested changes:
${editInstructions}`;

  return await callAI(systemPrompt);
}
