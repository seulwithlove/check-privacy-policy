import core from "../../rubric/core.json";
import type { Rule } from "./types";

/** Phase 1 ships a single jurisdiction-neutral rubric. Per-law layers come later. */
export const rules: Rule[] = core as Rule[];
