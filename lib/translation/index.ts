/**
 * Multi-language translation engine
 * Supports: OpenAI, DeepSeek, Anthropic, Google Gemini, Azure OpenAI
 * Reads provider config from api_providers site setting
 */

interface ProviderConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface TranslationConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

// ─── Call Per-Provider API ──────────────────

async function callOpenAI(text: string, from: string, to: string, config: TranslationConfig): Promise<string> {
  const prompt = `Translate the following content from ${from} to ${to}. Preserve all HTML tags, Markdown formatting, and structure. Only return the translated text, no explanations.\n\n${text}`;
  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || text;
}

async function callDeepSeek(text: string, from: string, to: string, config: TranslationConfig): Promise<string> {
  const prompt = `Translate the following content from ${from} to ${to}. Preserve all HTML tags, Markdown formatting, and structure. Only return the translated text, no explanations.\n\n${text}`;
  const res = await fetch(`${config.baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model || "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || text;
}

async function callAnthropic(text: string, from: string, to: string, config: TranslationConfig): Promise<string> {
  const prompt = `Translate the following content from ${from} to ${to}. Preserve all HTML tags, Markdown formatting, and structure. Only return the translated text, no explanations.\n\n${text}`;
  const res = await fetch(`${config.baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model || "claude-3-haiku-20240307",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.content?.[0]?.text || text;
}

async function callGemini(text: string, from: string, to: string, config: TranslationConfig): Promise<string> {
  const prompt = `Translate the following content from ${from} to ${to}. Preserve all HTML tags, Markdown formatting, and structure. Only return the translated text, no explanations.\n\n${text}`;
  const url = `${config.baseUrl}/models/${config.model || "gemini-2.0-flash"}:generateContent?key=${config.apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || text;
}

async function callAzure(text: string, from: string, to: string, config: TranslationConfig): Promise<string> {
  const prompt = `Translate the following content from ${from} to ${to}. Preserve all HTML tags, Markdown formatting, and structure. Only return the translated text, no explanations.\n\n${text}`;
  const res = await fetch(`${config.baseUrl}/openai/deployments/${config.model}/chat/completions?api-version=2024-02-01`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": config.apiKey },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`Azure API error: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || text;
}

// ─── Main Entry ─────────────────────────────

const PROVIDER_MAP: Record<string, (text: string, from: string, to: string, config: TranslationConfig) => Promise<string>> = {
  openai: callOpenAI,
  deepseek: callDeepSeek,
  anthropic: callAnthropic,
  gemini: callGemini,
  azure: callAzure,
};

export async function translateText(text: string, from: string, to: string, config: TranslationConfig): Promise<string> {
  if (!text || !to) return text;
  if (from === to) return text;

  const caller = PROVIDER_MAP[config.provider];
  if (!caller) throw new Error(`Unsupported translation provider: ${config.provider}`);

  try {
    return await caller(text, from, to, config);
  } catch (e) {
    console.warn(`Translation failed for provider ${config.provider}:`, e);
    throw e;
  }
}

/**
 * Batch translate all string fields in an object
 */
export async function translateObject<T extends Record<string, any>>(
  obj: T,
  from: string,
  to: string,
  config: TranslationConfig,
  skipFields: string[] = ["id", "slug", "locale", "translationGroupId", "createdAt", "updatedAt", "published", "legacyId", "image", "sortOrder"]
): Promise<T> {
  const result: Record<string, any> = { ...obj };

  for (const [key, value] of Object.entries(obj)) {
    if (skipFields.includes(key)) continue;
    if (typeof value === "string" && value.length > 1) {
      try {
        result[key] = await translateText(value, from, to, config);
      } catch (e) {
        console.warn(`Translation failed for field "${key}":`, e);
      }
    }
  }

  return result as T;
}

// ─── Load config from settings ─────────────

export async function getTranslationConfig(): Promise<TranslationConfig | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: ["api_providers", "default_api_provider", "translation_provider", "translation_api_key"] } },
    });

    const map = Object.fromEntries(settings.map((s: any) => [s.key, s.value]));

    // Try new api_providers format first
    if (map.api_providers) {
      try {
        const providers: Record<string, ProviderConfig> = JSON.parse(map.api_providers);
        const defaultKey = map.default_api_provider || "deepseek";
        const provider = providers[defaultKey];
        if (provider && provider.enabled && provider.apiKey) {
          return {
            provider: defaultKey,
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl || getDefaultBaseUrl(defaultKey),
            model: provider.model || getDefaultModel(defaultKey),
          };
        }
        // Fallback: find first enabled provider
        for (const [key, p] of Object.entries(providers)) {
          if (p.enabled && p.apiKey) {
            return {
              provider: key,
              apiKey: p.apiKey,
              baseUrl: p.baseUrl || getDefaultBaseUrl(key),
              model: p.model || getDefaultModel(key),
            };
          }
        }
      } catch {}
    }

    // Fallback to old translation_provider format
    const provider = map.translation_provider;
    const apiKey = map.translation_api_key;
    if (provider && apiKey) {
      return {
        provider,
        apiKey,
        baseUrl: getDefaultBaseUrl(provider),
        model: getDefaultModel(provider),
      };
    }

    return null;
  } catch {
    return null;
  }
}

function getDefaultBaseUrl(provider: string): string {
  const urls: Record<string, string> = {
    openai: "https://api.openai.com/v1",
    deepseek: "https://api.deepseek.com",
    anthropic: "https://api.anthropic.com/v1",
    gemini: "https://generativelanguage.googleapis.com/v1beta",
    azure: "https://YOUR_RESOURCE.openai.azure.com",
  };
  return urls[provider] || "";
}

function getDefaultModel(provider: string): string {
  const models: Record<string, string> = {
    openai: "gpt-4o-mini",
    deepseek: "deepseek-chat",
    anthropic: "claude-3-haiku-20240307",
    gemini: "gemini-2.0-flash",
    azure: "gpt-4o-mini",
  };
  return models[provider] || "";
}
