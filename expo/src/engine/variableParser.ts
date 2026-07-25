import type { VariableDefinition } from '@/types';

const VAR_REGEX = /\{\{(\w+)(?:([:|])([^}]*))?\}\}/g;

export function extractVariables(content: string): VariableDefinition[] {
  const variables: VariableDefinition[] = [];
  const seen = new Set<string>();

  let match;
  const regex = new RegExp(VAR_REGEX.source, VAR_REGEX.flags);

  while ((match = regex.exec(content)) !== null) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);

    const separator = match[2]; // ':' or '|' or undefined
    const rest = match[3]; // content after separator

    if (separator === ':' && rest) {
      // {{var:opt1|opt2|opt3}} → select
      const options = rest.split('|').map(o => o.trim()).filter(Boolean);
      variables.push({
        name,
        type: 'select',
        options,
        defaultValue: options[0],
        recentValues: [],
      });
    } else if (separator === '|' && rest) {
      // {{var|default}} → text with default
      variables.push({
        name,
        type: 'text',
        defaultValue: rest.trim(),
        recentValues: [],
      });
    } else {
      // {{var}} → plain text
      variables.push({
        name,
        type: 'text',
        recentValues: [],
      });
    }
  }

  return variables;
}

export function buildFinalPrompt(
  content: string,
  values: Record<string, string>
): string {
  return content.replace(
    /\{\{(\w+)(?:[:|][^}]*)?\}\}/g,
    (fullMatch, name) => values[name] ?? fullMatch
  );
}

export function hasVariables(content: string): boolean {
  return /\{\{\w+/.test(content);
}
