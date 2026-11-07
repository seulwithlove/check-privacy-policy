import core from "../../rubric/core.json";
import gdpr from "../../rubric/gdpr.json";
import ccpa from "../../rubric/ccpa.json";
import pipa from "../../rubric/pipa.json";
import type { Rule } from "./types";

export type Jurisdiction = "gdpr" | "ccpa" | "pipa";
export const JURISDICTIONS: Jurisdiction[] = ["gdpr", "ccpa", "pipa"];

const layers: Record<Jurisdiction, Rule[]> = { gdpr: gdpr as Rule[], ccpa: ccpa as Rule[], pipa: pipa as Rule[] };

/** Core rules plus the selected per-law layers, deduplicated by id. */
export function rulesFor(selected: Jurisdiction[]): Rule[] {
  const seen = new Set<string>();
  return [core as Rule[], ...selected.map((j) => layers[j] ?? [])].flat().filter((r) => !seen.has(r.id) && !!seen.add(r.id));
}

/** Jurisdiction-neutral core rubric. */
export const rules: Rule[] = rulesFor([]);
