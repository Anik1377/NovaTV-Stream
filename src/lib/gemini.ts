/**
 * Google Gemini API helper for deployed environments.
 * Uses GEMINI_API_KEY env var (free tier at https://aistudio.google.com/apikey).
 * Falls back gracefully when no key is configured.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ── Types ──
export interface GeminiSource {
  title: string;
  url: string;
  snippet: string;
  host_name: string;
}

export interface GeminiResult {
  text: string;
  sources: GeminiSource[];
}

// ── Core ──
export function isGeminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

/**
 * Call Gemini with optional Google Search grounding.
 * Returns generated text + any grounded web sources.
 */
export async function geminiGenerate(
  prompt: string,
  options?: { systemInstruction?: string; useSearch?: boolean },
): Promise<GeminiResult> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const url = `${GEMINI_BASE}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  if (options?.systemInstruction) {
    body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  if (options?.useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Extract grounding sources if search was used
  const sources: GeminiSource[] = [];
  const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(chunks)) {
    for (const chunk of chunks) {
      const web = chunk?.web;
      if (web?.uri && web?.title) {
        let host = '';
        try { host = new URL(web.uri).hostname.replace('www.', ''); } catch { /* ignore */ }
        sources.push({
          title: web.title,
          url: web.uri,
          snippet: '',
          host_name: host,
        });
      }
    }
  }

  return { text, sources };
}

/**
 * Simple Gemini chat call (no grounding).
 */
export async function geminiChat(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const result = await geminiGenerate(userMessage, { systemInstruction: systemPrompt });
  return result.text;
}
