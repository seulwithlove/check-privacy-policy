import { describe, expect, it } from "vitest";
import { parseResponse, scoreFindings, verifyFindings } from "../src/core/analyzer";
import { chunkText, findPolicyLink } from "../src/core/text";
import { rules } from "../src/core/rubric";

const policy = "We may sell your personal information to partners.\nWe keep data as long as we want.";

describe("verifyFindings", () => {
  it("keeps verbatim quotes and drops fabricated ones or unknown rules", () => {
    const { findings, dropped } = verifyFindings(
      [
        { ruleId: "data-selling", quote: "We may sell your personal information", explanation: "x" },
        { ruleId: "data-selling", quote: "We never ever share anything at all", explanation: "made up" },
        { ruleId: "nope", quote: "We may sell your personal information", explanation: "bad rule" },
      ],
      policy, rules,
    );
    expect(findings).toHaveLength(1);
    expect(dropped).toBe(2);
  });
  it("tolerates whitespace and case differences", () => {
    const { findings } = verifyFindings([{ ruleId: "indefinite-retention", quote: "WE KEEP   data as long as we want", explanation: "x" }], policy, rules);
    expect(findings).toHaveLength(1);
  });
});

describe("parseResponse", () => {
  it("handles code fences and garbage", () => {
    expect(parseResponse('```json\n{"findings":[{"ruleId":"a","quote":"b","explanation":"c"}],"summary":"s"}\n```').findings).toHaveLength(1);
    expect(parseResponse("not json").findings).toEqual([]);
  });
});

describe("scoreFindings", () => {
  it("caps at 100", () => {
    const f = rules.map((r) => ({ ruleId: r.id, quote: "q", explanation: "e", rule: { ...r, severity: 3 as const } }));
    expect(scoreFindings(f)).toBe(100);
  });
});

describe("chunkText", () => {
  it("respects the max size", () => {
    const chunks = chunkText(("a".repeat(50) + "\n").repeat(10), 120);
    expect(chunks.every((c) => c.length <= 120)).toBe(true);
    expect(chunks.length).toBeGreaterThan(1);
  });
});

describe("findPolicyLink", () => {
  it("finds English and Korean links", () => {
    expect(findPolicyLink([{ href: "https://a.com/about", text: "About" }, { href: "https://a.com/p", text: "Privacy Policy" }])).toBe("https://a.com/p");
    expect(findPolicyLink([{ href: "https://a.kr/x", text: "개인정보처리방침" }])).toBe("https://a.kr/x");
    expect(findPolicyLink([{ href: "https://a.com/about", text: "About" }])).toBeNull();
  });
});
