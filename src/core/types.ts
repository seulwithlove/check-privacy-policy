export interface Rule {
  id: string;
  title: string;
  description: string;
  /** 1 = notable, 2 = concerning, 3 = serious */
  severity: 1 | 2 | 3;
  laws?: string[];
}

/** What the LLM claims. Untrusted until verified against the source text. */
export interface RawFinding {
  ruleId: string;
  quote: string;
  explanation: string;
}

export interface Finding extends RawFinding {
  rule: Rule;
}

export interface Report {
  /** 0 (few concerns) .. 100 (many serious concerns) */
  score: number;
  findings: Finding[];
  /** Findings dropped because the quote was not found in the policy or the rule id was unknown. */
  droppedCount: number;
  summary: string;
}

export interface LlmProvider {
  readonly name: string;
  complete(system: string, user: string): Promise<string>;
}
