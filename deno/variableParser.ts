import { VariableDefinition } from "./db.ts";

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

    const separator = match[2]; // ':' or '|'
    const rest = match[3];

    if (separator === ':' && rest) {
      const options = rest.split('|').map(o => o.trim()).filter(Boolean);
      variables.push({
        name,
        type: 'select',
        options,
        defaultValue: options[0],
      });
    } else if (separator === '|' && rest) {
      variables.push({
        name,
        type: 'text',
        defaultValue: rest.trim(),
      });
    } else {
      variables.push({
        name,
        type: 'text',
      });
    }
  }

  return variables;
}
