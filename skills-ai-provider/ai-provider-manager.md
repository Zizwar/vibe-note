# Skill: AI Provider Manager (Expo / React Native)

## Purpose
Reusable expertise for adding, configuring, and managing AI providers and models in any Expo or React Native app. Covers OpenAI, OpenRouter, and any OpenAI-compatible endpoint.

---

## Core Concepts

### OpenAI-Compatible API
Most modern AI providers (OpenRouter, Groq, Together.ai, Ollama, LM Studio, etc.) implement the same REST API as OpenAI:
- Endpoint: `POST /v1/chat/completions`
- Same request/response shape
- Only differences: base URL, API key, and model name format

This means **one fetch function handles all providers** — just swap the base URL and key.

---

## Provider Config Pattern

### Simple (single provider)
```javascript
const AI_CONFIG = {
  baseURL: 'https://openrouter.ai/api/v1/chat/completions',
  models: [
    { name: 'GPT-4o',            value: 'openai/gpt-4o',            provider: 'OpenAI',    cost: 'High'   },
    { name: 'GPT-4o Mini',       value: 'openai/gpt-4o-mini',       provider: 'OpenAI',    cost: 'Low'    },
    { name: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3-5-sonnet', provider: 'Anthropic', cost: 'Medium' },
    { name: 'Gemini 1.5 Pro',    value: 'google/gemini-1.5-pro',    provider: 'Google',    cost: 'Medium' },
    { name: 'Llama 3.1 8B (Free)', value: 'meta-llama/llama-3.1-8b-instruct:free', provider: 'Meta', cost: 'Free' },
    { name: 'DeepSeek R1 (Free)', value: 'deepseek/deepseek-r1:free', provider: 'DeepSeek', cost: 'Free'  },
    { name: 'Mixtral 8x7B',      value: 'mistralai/mixtral-8x7b-instruct', provider: 'Mistral', cost: 'Low' },
  ]
};
```

### Multi-provider
```javascript
const PROVIDERS = {
  openrouter: {
    label: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1/chat/completions',
    keyName: 'openrouter_api_key',   // SecureStore key
    models: [
      { name: 'GPT-4o',     value: 'openai/gpt-4o',     provider: 'OpenAI',    cost: 'High'   },
      { name: 'GPT-4.1 Mini', value: 'openai/gpt-4.1-mini', provider: 'OpenAI', cost: 'Low'   },
      { name: 'Claude 3.5 Sonnet', value: 'anthropic/claude-3-5-sonnet', provider: 'Anthropic', cost: 'Medium' },
      { name: 'Gemini 2.0 Flash', value: 'google/gemini-2.0-flash-001', provider: 'Google', cost: 'Low' },
      { name: 'Llama 3.3 70B (Free)', value: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'Meta', cost: 'Free' },
      { name: 'DeepSeek R1 (Free)', value: 'deepseek/deepseek-r1:free', provider: 'DeepSeek', cost: 'Free' },
    ]
  },
  openai: {
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1/chat/completions',
    keyName: 'openai_api_key',
    models: [
      { name: 'GPT-4o',       value: 'gpt-4o',       provider: 'OpenAI', cost: 'High'   },
      { name: 'GPT-4o Mini',  value: 'gpt-4o-mini',  provider: 'OpenAI', cost: 'Low'    },
      { name: 'GPT-4.1',      value: 'gpt-4.1',      provider: 'OpenAI', cost: 'High'   },
      { name: 'GPT-4.1 Mini', value: 'gpt-4.1-mini', provider: 'OpenAI', cost: 'Low'    },
      { name: 'o4-mini',      value: 'o4-mini',       provider: 'OpenAI', cost: 'Medium' },
    ]
  },
  groq: {
    label: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1/chat/completions',
    keyName: 'groq_api_key',
    models: [
      { name: 'Llama 3.3 70B',  value: 'llama-3.3-70b-versatile',     provider: 'Groq', cost: 'Free' },
      { name: 'Llama 3.1 8B',   value: 'llama-3.1-8b-instant',        provider: 'Groq', cost: 'Free' },
      { name: 'Mixtral 8x7B',   value: 'mixtral-8x7b-32768',          provider: 'Groq', cost: 'Free' },
      { name: 'Gemma 2 9B',     value: 'gemma2-9b-it',                provider: 'Groq', cost: 'Free' },
    ]
  },
  together: {
    label: 'Together AI',
    baseURL: 'https://api.together.xyz/v1/chat/completions',
    keyName: 'together_api_key',
    models: [
      { name: 'Llama 3.1 70B', value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', provider: 'Together', cost: 'Low' },
      { name: 'Mistral 7B',    value: 'mistralai/Mistral-7B-Instruct-v0.3',            provider: 'Together', cost: 'Low' },
    ]
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    baseURL: null,       // user enters manually
    keyName: 'custom_api_key',
    models: []           // user enters model name manually
  }
};
```

---

## API Key Storage

Always use `expo-secure-store` for API keys, never AsyncStorage:

```javascript
import * as SecureStore from 'expo-secure-store';

// Load
const loadKey = async (keyName) => {
  try {
    return await SecureStore.getItemAsync(keyName) || '';
  } catch (e) {
    return '';
  }
};

// Save
const saveKey = async (keyName, value) => {
  try {
    await SecureStore.setItemAsync(keyName, value);
  } catch (e) {
    console.error('SecureStore error:', e);
  }
};
```

---

## Universal Chat Completion Call

Works with OpenAI, OpenRouter, Groq, Together, custom — any OpenAI-compatible:

```javascript
const callAI = async ({ baseURL, apiKey, model, messages, temperature = 0.7, maxTokens = 2000, extraHeaders = {} }) => {
  const response = await fetch(baseURL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders   // e.g. OpenRouter needs HTTP-Referer
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    usage: data.usage   // { prompt_tokens, completion_tokens, total_tokens }
  };
};
```

### OpenRouter extra headers:
```javascript
extraHeaders: {
  'HTTP-Referer': 'https://your-app.com',
  'X-Title': 'Your App Name'
}
```

---

## State Setup

```javascript
const [selectedProvider, setSelectedProvider] = useState('openrouter');
const [selectedModel, setSelectedModel] = useState('openai/gpt-4o-mini');
const [apiKeys, setApiKeys] = useState({});          // { openrouter: '...', openai: '...' }
const [customBaseURL, setCustomBaseURL] = useState('');
const [customModelName, setCustomModelName] = useState('');
const [showProviderPicker, setShowProviderPicker] = useState(false);
const [showModelPicker, setShowModelPicker] = useState(false);

// Load all keys on mount
useEffect(() => {
  const loadAllKeys = async () => {
    const keys = {};
    for (const [id, cfg] of Object.entries(PROVIDERS)) {
      if (cfg.keyName) keys[id] = await loadKey(cfg.keyName);
    }
    setApiKeys(keys);
  };
  loadAllKeys();
}, []);
```

---

## Model Picker UI (React Native)

```jsx
{/* Provider selector */}
<TouchableOpacity onPress={() => setShowProviderPicker(!showProviderPicker)}>
  <Text>{PROVIDERS[selectedProvider].label}</Text>
  <Icon name="chevron-down" />
</TouchableOpacity>

{showProviderPicker && (
  <View style={styles.dropdown}>
    {Object.entries(PROVIDERS).map(([id, cfg]) => (
      <TouchableOpacity
        key={id}
        onPress={() => {
          setSelectedProvider(id);
          setSelectedModel(cfg.models[0]?.value || '');
          setShowProviderPicker(false);
        }}
      >
        <Text style={selectedProvider === id ? styles.selected : styles.item}>
          {cfg.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
)}

{/* Model selector */}
<TouchableOpacity onPress={() => setShowModelPicker(!showModelPicker)}>
  <Text>
    {PROVIDERS[selectedProvider].models.find(m => m.value === selectedModel)?.name || selectedModel}
  </Text>
</TouchableOpacity>

{showModelPicker && (
  <ScrollView style={styles.dropdown}>
    {PROVIDERS[selectedProvider].models.map(model => (
      <TouchableOpacity
        key={model.value}
        onPress={() => { setSelectedModel(model.value); setShowModelPicker(false); }}
      >
        <Text style={styles.modelName}>{model.name}</Text>
        <Text style={styles.modelMeta}>{model.provider} · {model.cost}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
)}

{/* Custom provider input */}
{selectedProvider === 'custom' && (
  <>
    <TextInput
      placeholder="Base URL (e.g. http://localhost:11434/v1/chat/completions)"
      value={customBaseURL}
      onChangeText={setCustomBaseURL}
    />
    <TextInput
      placeholder="Model name (e.g. llama3)"
      value={customModelName}
      onChangeText={setCustomModelName}
    />
  </>
)}

{/* API key input */}
<TextInput
  placeholder={`${PROVIDERS[selectedProvider].label} API Key`}
  value={apiKeys[selectedProvider] || ''}
  secureTextEntry
  onChangeText={async (val) => {
    const cfg = PROVIDERS[selectedProvider];
    if (cfg.keyName) await saveKey(cfg.keyName, val);
    setApiKeys(prev => ({ ...prev, [selectedProvider]: val }));
  }}
/>
```

---

## Cost / Token Tracking

```javascript
// Structure (store in AsyncStorage)
const DEFAULT_USAGE = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalCost: 0,
  requestCount: 0
};

// Per-model pricing (per 1K tokens, USD) — update from provider docs
const MODEL_PRICING = {
  'gpt-4o':           { input: 0.0025,  output: 0.01   },
  'gpt-4o-mini':      { input: 0.00015, output: 0.0006 },
  'gpt-4.1':          { input: 0.002,   output: 0.008  },
  'gpt-4.1-mini':     { input: 0.0004,  output: 0.0016 },
  // For unknown models, use a safe fallback:
  _default:           { input: 0.001,   output: 0.002  }
};

const calcCost = (modelValue, inputTokens, outputTokens) => {
  // Strip provider prefix for OpenRouter models: 'openai/gpt-4o' → 'gpt-4o'
  const modelKey = modelValue.includes('/') ? modelValue.split('/').slice(1).join('/') : modelValue;
  const pricing = MODEL_PRICING[modelKey] || MODEL_PRICING._default;
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;
};
```

---

## Adding a New Provider — Checklist

1. Add entry to `PROVIDERS` object with `label`, `baseURL`, `keyName`, `models[]`
2. Add models as `{ name, value, provider, cost }` objects
3. For OpenAI-compatible: request format is identical, only change `baseURL` and `keyName`
4. Add any required extra headers (e.g. OpenRouter needs `HTTP-Referer`)
5. For free-tier models on OpenRouter: append `:free` to model value

---

## Common Providers Reference

| Provider | Base URL | Key required | Model format |
|---|---|---|---|
| OpenRouter | `https://openrouter.ai/api/v1/chat/completions` | Yes | `provider/model` |
| OpenAI | `https://api.openai.com/v1/chat/completions` | Yes | `model-name` |
| Groq | `https://api.groq.com/openai/v1/chat/completions` | Yes | `model-name` |
| Together AI | `https://api.together.xyz/v1/chat/completions` | Yes | `org/model` |
| Ollama (local) | `http://localhost:11434/v1/chat/completions` | No | `model-name` |
| LM Studio (local) | `http://localhost:1234/v1/chat/completions` | No | `model-name` |
| Mistral | `https://api.mistral.ai/v1/chat/completions` | Yes | `model-name` |
| Cohere | `https://api.cohere.com/compatibility/v1/chat/completions` | Yes | `model-name` |

---

## Packages Needed

```bash
# For secure API key storage
npx expo install expo-secure-store

# For general settings / non-sensitive data
@react-native-async-storage/async-storage  # usually already installed
```

---

## Notes

- Always store API keys in `expo-secure-store`, never AsyncStorage
- Define `PROVIDERS` / `AI_CONFIG` outside the component to avoid recreation on every render
- OpenRouter is the easiest starting point: one key, access to 100+ models
- For streaming responses, use `fetch` with `ReadableStream` or switch to the `openai` npm package
- The `cost` field in model objects is just a UI hint — calculate actual cost from `usage` tokens in the response
