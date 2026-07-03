// Real downloadable local models — auto-discovered from the backends running
// on this machine: Ollama (localhost:11434) and LM Studio (localhost:1234).
// The browser talks straight to the local servers — no cloud APIs, no keys.

const OLLAMA_URL = 'http://localhost:11434';
const LMSTUDIO_URL = 'http://localhost:1234';

export type LocalBackend = 'ollama' | 'lmstudio';

export interface LocalModel {
  id: string;
  label: string;
  detail: string;
  /** Backend-native model identifier */
  model: string;
  backend: LocalBackend;
  installed: boolean;
  setup: string;
}

type LocalModelRegistryEntry = LocalModel & {
  aliases: RegExp[];
};

export const LOCAL_MODEL_REGISTRY: LocalModelRegistryEntry[] = [
  {
    id: 'qwen-coder',
    label: 'Qwen Coder',
    detail: 'Default local builder · 1.5B',
    model: 'qwen2.5-coder:1.5b',
    backend: 'ollama',
    installed: false,
    setup: 'ollama pull qwen2.5-coder:1.5b',
    aliases: [/qwen.*coder/i, /qwen2\.5-coder/i, /qwen3-coder/i],
  },
];

// Non-chat models that should never appear in the picker.
const EXCLUDED_PATTERNS = [/embed/i, /whisper/i, /video/i, /audio/i, /vision-only/i, /^ltx-/i];

function isChatModel(name: string): boolean {
  return !EXCLUDED_PATTERNS.some((pattern) => pattern.test(name));
}

function prettyLabel(name: string): { label: string; detail: string } {
  // "qwen2.5-coder:1.5b" -> label "Qwen2.5 Coder", detail "1.5B"
  // "google/gemma-4-e4b" -> label "Gemma 4 E4b", detail ""
  const base = name.split('/').pop() ?? name;
  const [family, tag] = base.split(':');
  const label = family
    .split(/[-_.]/)
    .filter((part) => part && !/^\d+b$/i.test(part))
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(' ')
    .replace(/(\d) (\d)/g, '$1.$2');
  const detail = tag ? tag.toUpperCase() : '';
  return { label: label || base, detail };
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function discoverOllamaModels(): Promise<LocalModel[]> {
  const data = (await fetchJson(`${OLLAMA_URL}/api/tags`)) as { models?: Array<{ name: string }> } | null;
  return (data?.models ?? [])
    .map((entry) => entry.name)
    .filter(isChatModel)
    .map((name) => ({ id: `ollama:${name}`, model: name, backend: 'ollama' as const, installed: true, setup: '', ...prettyLabel(name) }));
}

async function discoverLmStudioModels(): Promise<LocalModel[]> {
  const data = (await fetchJson(`${LMSTUDIO_URL}/v1/models`)) as { data?: Array<{ id: string }> } | null;
  return (data?.data ?? [])
    .map((entry) => entry.id)
    .filter(isChatModel)
    .map((name) => ({ id: `lmstudio:${name}`, model: name, backend: 'lmstudio' as const, installed: true, setup: '', ...prettyLabel(name) }));
}

/** Every chat-capable model installed locally, across all running backends. */
export async function discoverLocalModels(): Promise<LocalModel[]> {
  const [ollama, lmstudio] = await Promise.all([discoverOllamaModels(), discoverLmStudioModels()]);
  const discovered = [...ollama, ...lmstudio];
  const registryModels = LOCAL_MODEL_REGISTRY.map(({ aliases, ...entry }) => {
    const match = discovered.find((model) =>
      model.backend === entry.backend && aliases.some((pattern) => pattern.test(model.model)),
    );
    return match
      ? {
          ...entry,
          model: match.model,
          backend: match.backend,
          installed: true,
          setup: '',
        }
      : entry;
  });
  return registryModels;
}

export class LocalModelError extends Error {
  constructor(message: string, readonly hint: string) {
    super(message);
    this.name = 'LocalModelError';
  }
}

interface ChatOptions {
  signal?: AbortSignal;
  onChunk?: (chunk: string, fullText: string) => void;
  maxTokens?: number;
  temperature?: number;
}

function emitChunk(options: ChatOptions | undefined, chunk: string, fullText: string): void {
  if (!chunk) return;
  options?.onChunk?.(chunk, fullText);
}

async function chatOllama(model: string, messages: Array<{ role: string; content: string }>, options?: ChatOptions): Promise<string> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options?.signal,
    body: JSON.stringify({
      model,
      messages,
      stream: Boolean(options?.onChunk),
      options: {
        temperature: options?.temperature ?? 0.6,
        num_predict: options?.maxTokens ?? 1600,
      },
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new LocalModelError(`Ollama request failed (${response.status}).`, body.slice(0, 200));
  }
  if (options?.onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parsed = JSON.parse(trimmed) as { message?: { content?: string } };
        const chunk = parsed.message?.content ?? '';
        fullText += chunk;
        emitChunk(options, chunk, fullText);
      }
    }
    if (buffer.trim()) {
      const parsed = JSON.parse(buffer.trim()) as { message?: { content?: string } };
      const chunk = parsed.message?.content ?? '';
      fullText += chunk;
      emitChunk(options, chunk, fullText);
    }
    return fullText;
  }
  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content ?? '';
}

async function chatLmStudio(model: string, messages: Array<{ role: string; content: string }>, options?: ChatOptions): Promise<string> {
  const response = await fetch(`${LMSTUDIO_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options?.signal,
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.6,
      max_tokens: options?.maxTokens ?? 1600,
      stream: Boolean(options?.onChunk),
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new LocalModelError(`LM Studio request failed (${response.status}).`, body.slice(0, 200));
  }
  if (options?.onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const event of events) {
        const line = event
          .split('\n')
          .map((entry) => entry.trim())
          .find((entry) => entry.startsWith('data:'));
        if (!line) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        const parsed = JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> };
        const chunk = parsed.choices?.[0]?.delta?.content ?? '';
        fullText += chunk;
        emitChunk(options, chunk, fullText);
      }
    }
    return fullText;
  }
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

export async function chatWithLocalModel(target: LocalModel, messages: Array<{ role: string; content: string }>, options?: ChatOptions): Promise<string> {
  if (!target.installed) {
    throw new LocalModelError(`${target.label} is not available in a running local runtime.`, target.setup);
  }
  return target.backend === 'lmstudio' ? chatLmStudio(target.model, messages, options) : chatOllama(target.model, messages, options);
}
