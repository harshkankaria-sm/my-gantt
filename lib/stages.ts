import type { StageKey, Status, SubStageKey } from "./types";

export interface StageDef {
  key: StageKey;
  name: string;
  short: string;
  color: string;
  /** Default working days. */
  est: number;
  /** pre = mine (ends by "handover by") · post = others' */
  phase: "pre" | "post";
}

export const STAGES: readonly StageDef[] = [
  { key: "prd", name: "PRD finalise", short: "PRD", color: "#e46a9b", est: 5, phase: "pre" },
  { key: "review", name: "PRD review", short: "Review", color: "#b57be0", est: 1, phase: "pre" },
  { key: "solution", name: "Solutioning", short: "Solutioning", color: "#7ea6f2", est: 2, phase: "pre" },
  { key: "handover", name: "Handover call", short: "Handover", color: "#4fb8c4", est: 1, phase: "pre" },
  { key: "dev", name: "Dev", short: "Dev", color: "#d6a03c", est: 5, phase: "post" },
  { key: "qa", name: "QA / UAT", short: "QA", color: "#e2703f", est: 2, phase: "post" },
  { key: "release", name: "Release", short: "Release", color: "#5fbf72", est: 1, phase: "post" },
  { key: "verify", name: "Verification", short: "Verify", color: "#98a6b8", est: 1, phase: "post" },
];

export const SUB_STAGES: readonly SubStageKey[] = ["prd", "dev"];

/** Default PRD steps and their days. Their sum is PRD's default. */
export const PRD_STEPS: readonly { name: string; days: number }[] = [
  { name: "Problem framing", days: 0.5 },
  { name: "Research", days: 1 },
  { name: "Solution & scope", days: 1 },
  { name: "Design", days: 2 },
  { name: "Metrics & tracking", days: 0.5 },
];

/** Days a step can take. */
export const STEP_DAYS: readonly number[] = [0.5, 1, 2, 3, 5, 8, 13];

/** A new step's days. */
export const NEW_STEP_DAYS = 1;

export const STATUS: Record<Status, string> = {
  todo: "Not started",
  doing: "In progress",
  done: "Done",
};

export const stageDef = (key: StageKey): StageDef => STAGES.find((s) => s.key === key)!;
