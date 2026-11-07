import { normalize } from "./text";
import type { Report } from "./types";

/** Bump when the prompt or scoring changes so old cached reports are not reused. */
export const ANALYSIS_VERSION = "1";
const MAX_ENTRIES = 50;

export async function policyKey(text: string, rubricIds: string[], language: string, providerId: string, model: string): Promise<string> {
  const input = [ANALYSIS_VERSION, normalize(text), [...rubricIds].sort().join(","), language, providerId, model].join("\0");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cache is optional: any storage failure is ignored. */
export async function getCached(key: string): Promise<Report | null> {
  try {
    const r = await chrome.storage.local.get(`report:${key}`);
    return (r[`report:${key}`] as Report | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function putCached(key: string, report: Report): Promise<void> {
  try {
    const { reportIndex = [] } = (await chrome.storage.local.get("reportIndex")) as { reportIndex?: string[] };
    const index = reportIndex.filter((k) => k !== key);
    index.push(key);
    const evicted = index.splice(0, Math.max(0, index.length - MAX_ENTRIES));
    if (evicted.length) await chrome.storage.local.remove(evicted.map((k) => `report:${k}`));
    await chrome.storage.local.set({ [`report:${key}`]: report, reportIndex: index });
  } catch {
    /* ignore */
  }
}
