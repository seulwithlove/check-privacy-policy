import type { LlmProvider } from "../types";

export type ProviderId = "anthropic" | "openai";

async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`LLM request failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

export function createProvider(id: ProviderId, apiKey: string, model?: string): LlmProvider {
  if (id === "anthropic") {
    return {
      name: "Anthropic",
      async complete(system, user) {
        const data = await postJson(
          "https://api.anthropic.com/v1/messages",
          { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          { model: model ?? "claude-sonnet-5-5", max_tokens: 4096, system, messages: [{ role: "user", content: user }] },
        );
        return data.content?.map((c: any) => c.text ?? "").join("") ?? "";
      },
    };
  }
  return {
    name: "OpenAI",
    async complete(system, user) {
      const data = await postJson(
        "https://api.openai.com/v1/chat/completions",
        { authorization: `Bearer ${apiKey}` },
        { model: model ?? "gpt-4o-mini", messages: [{ role: "system", content: system }, { role: "user", content: user }] },
      );
      return data.choices?.[0]?.message?.content ?? "";
    },
  };
}
