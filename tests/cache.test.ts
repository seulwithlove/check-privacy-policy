import { describe, expect, it } from "vitest";
import { policyKey } from "../src/core/cache";
import { JURISDICTIONS, rules, rulesFor } from "../src/core/rubric";

describe("policyKey", () => {
  const base: [string, string[], string, string, string] = ["We keep data.", ["a", "b"], "en", "anthropic", "m"];
  const key = (...o: Partial<[string, string[], string, string, string]>) => {
    const v: [string, string[], string, string, string] = [...base];
    o.forEach((x, i) => { if (x !== undefined) (v as any)[i] = x; });
    return policyKey(...v);
  };
  it("is stable and whitespace-insensitive", async () => {
    expect(await key()).toBe(await key());
    expect(await key("We  keep\n data.")).toBe(await key());
  });
  it("changes with text, rubric, language, provider, model", async () => {
    const k = await key();
    for (const k2 of [await key("Other."), await key(undefined, ["a"]), await key(undefined, undefined, "ko"), await key(undefined, undefined, undefined, "openai"), await key(undefined, undefined, undefined, undefined, "x")])
      expect(k2).not.toBe(k);
  });
});

describe("rulesFor", () => {
  it("adds layers on top of core without duplicates", () => {
    const ids = rulesFor(JURISDICTIONS).map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(rules.map((r) => r.id)));
    expect(rulesFor(["pipa"]).some((r) => r.id.startsWith("pipa-"))).toBe(true);
    for (const r of rulesFor(JURISDICTIONS)) {
      expect([1, 2, 3]).toContain(r.severity);
      expect(r.description.length).toBeGreaterThan(0);
    }
  });
});
