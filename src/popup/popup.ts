import { analyzePolicy } from "../core/analyzer";
import { createProvider, type ProviderId } from "../core/providers";
import { rules } from "../core/rubric";
import { findPolicyLink, htmlToText } from "../core/text";
import type { Report } from "../core/types";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = (msg: string) => { $("status").textContent = msg; };

async function loadSettings() {
  const s = await chrome.storage.local.get(["provider", "apiKey"]);
  $<HTMLSelectElement>("provider").value = s.provider ?? "anthropic";
  $<HTMLInputElement>("apiKey").value = s.apiKey ?? "";
  if (!s.apiKey) $<HTMLDetailsElement>("settings").open = true;
}

async function detectPolicyLink() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return status("No active tab.");
  const [res] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => [...document.querySelectorAll("a[href]")].map((a) => ({ href: (a as HTMLAnchorElement).href, text: a.textContent?.trim() ?? "" })),
  });
  const link = findPolicyLink(res.result ?? []);
  if (link) { $<HTMLInputElement>("url").value = link; status("Found a policy link."); }
  else status("No privacy policy link found on this page. Paste the URL instead.");
}

async function fetchPolicyText(url: string): Promise<string> {
  const origin = new URL(url).origin + "/*";
  if (!(await chrome.permissions.contains({ origins: [origin] }))) {
    if (!(await chrome.permissions.request({ origins: [origin] }))) throw new Error("Permission to read that site was denied.");
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch the policy (${res.status}).`);
  return htmlToText(await res.text());
}

function render(report: Report) {
  const root = $("result");
  root.replaceChildren();
  const el = (tag: string, text: string, cls?: string) => { const e = document.createElement(tag); e.textContent = text; if (cls) e.className = cls; return e; };
  root.append(el("div", `${report.score}/100`, "score"), el("p", report.summary));
  if (!report.findings.length) root.append(el("p", "No concerning clauses were found. That does not guarantee the policy is safe."));
  for (const f of report.findings) {
    const box = el("div", "", `finding s${f.rule.severity}`);
    box.append(el("strong", f.rule.title), el("blockquote", `"${f.quote}"`), el("div", f.explanation));
    if (f.rule.laws?.length) box.append(el("div", f.rule.laws.join(" · "), "laws"));
    root.append(box);
  }
  if (report.droppedCount) root.append(el("p", `${report.droppedCount} unverified claim(s) from the model were discarded.`, "hint"));
  root.hidden = false;
}

async function analyze() {
  const url = $<HTMLInputElement>("url").value.trim();
  const { provider, apiKey } = await chrome.storage.local.get(["provider", "apiKey"]);
  if (!apiKey) { $<HTMLDetailsElement>("settings").open = true; return status("Add your API key first."); }
  if (!url) return status("Enter a policy URL or use 'Find on this page'.");
  const btn = $<HTMLButtonElement>("analyze");
  btn.disabled = true;
  try {
    status("Fetching policy…");
    const text = await fetchPolicyText(url);
    if (text.length < 200) throw new Error("The page has too little text (it may need JavaScript to load).");
    const report = await analyzePolicy({
      text, rules, language: navigator.language,
      provider: createProvider((provider ?? "anthropic") as ProviderId, apiKey),
      onProgress: (d, t) => status(`Analyzing… ${d}/${t}`),
    });
    render(report);
    status("Done.");
  } catch (e) {
    status(e instanceof Error ? e.message : String(e));
  } finally {
    btn.disabled = false;
  }
}

$("save").addEventListener("click", async () => {
  await chrome.storage.local.set({ provider: $<HTMLSelectElement>("provider").value, apiKey: $<HTMLInputElement>("apiKey").value.trim() });
  status("Saved.");
});
$("detect").addEventListener("click", detectPolicyLink);
$("analyze").addEventListener("click", analyze);
loadSettings();
