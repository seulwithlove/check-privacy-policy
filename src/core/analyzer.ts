import type { Finding, LlmProvider, RawFinding, Report, Rule } from "./types";
import { chunkText, normalize } from "./text";

export function buildSystemPrompt(rules: Rule[], language: string): string {
  const rubric = rules.map((r) => `- ${r.id} (severity ${r.severity}): ${r.title}. ${r.description}`).join("\n");
  return [
    "You analyze privacy policies for ordinary people who will not read them.",
    "Find clauses that match the rubric below. Be precise; do not flag clauses that merely mention a topic harmlessly.",
    "For every finding, `quote` MUST be copied verbatim from the policy text (a single sentence or short span, in the original language). Never paraphrase the quote.",
    `Write \`explanation\` and \`summary\` in this language: ${language}. Use plain words, no legalese.`,
    "Respond with JSON only, no markdown:",
    '{"findings":[{"ruleId":"...","quote":"...","explanation":"..."}],"summary":"one or two sentences about this excerpt"}',
    "If nothing matches, return an empty findings array.",
    "",
    "RUBRIC:",
    rubric,
  ].join("\n");
}

/** Pull the first JSON object out of an LLM response, tolerating code fences and prose. */
export function parseResponse(raw: string): { findings: RawFinding[]; summary: string } {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return { findings: [], summary: "" };
  try {
    const obj = JSON.parse(raw.slice(start, end + 1));
    const findings = Array.isArray(obj.findings) ? obj.findings : [];
    return {
      findings: findings.filter(
        (f: any) => typeof f?.ruleId === "string" && typeof f?.quote === "string" && typeof f?.explanation === "string",
      ),
      summary: typeof obj.summary === "string" ? obj.summary : "",
    };
  } catch {
    return { findings: [], summary: "" };
  }
}

/** Keep only findings whose rule exists and whose quote really appears in the policy. */
export function verifyFindings(raw: RawFinding[], policyText: string, rules: Rule[]) {
  const byId = new Map(rules.map((r) => [r.id, r]));
  const haystack = normalize(policyText);
  const seen = new Set<string>();
  const findings: Finding[] = [];
  let dropped = 0;
  for (const f of raw) {
    const rule = byId.get(f.ruleId);
    const q = normalize(f.quote);
    if (!rule || q.length < 8 || !haystack.includes(q)) { dropped++; continue; }
    const key = `${f.ruleId}|${q}`;
    if (seen.has(key)) continue;
    seen.add(key);
    findings.push({ ...f, rule });
  }
  return { findings, dropped };
}

export function scoreFindings(findings: Finding[]): number {
  // One finding per rule counts fully; repeats of the same rule add little.
  const perRule = new Map<string, number>();
  for (const f of findings) perRule.set(f.ruleId, (perRule.get(f.ruleId) ?? 0) + 1);
  let score = 0;
  for (const [id, n] of perRule) {
    const sev = findings.find((f) => f.ruleId === id)!.rule.severity;
    score += sev * 10 + Math.min(n - 1, 2) * 2;
  }
  return Math.min(100, score);
}

export async function analyzePolicy(opts: {
  text: string;
  rules: Rule[];
  provider: LlmProvider;
  language: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<Report> {
  const chunks = chunkText(opts.text);
  const system = buildSystemPrompt(opts.rules, opts.language);
  const raw: RawFinding[] = [];
  const summaries: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const res = parseResponse(await opts.provider.complete(system, `POLICY EXCERPT:\n\n${chunks[i]}`));
    raw.push(...res.findings);
    if (res.summary) summaries.push(res.summary);
    opts.onProgress?.(i + 1, chunks.length);
  }
  const { findings, dropped } = verifyFindings(raw, opts.text, opts.rules);
  findings.sort((a, b) => b.rule.severity - a.rule.severity);
  return { score: scoreFindings(findings), findings, droppedCount: dropped, summary: summaries.join(" ") };
}
