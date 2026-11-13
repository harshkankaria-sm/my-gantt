// Planning engine: every stage and step backward from the project deadline.
// Pure: `today` is passed in where it's needed, and nothing here mutates its inputs.

import { firstWork, prevWork, spanStart, toWork, type ISODate } from "./dates";
import { STAGES, type StageDef } from "./stages";
import type { Plan, Project, Range, StageKey, StageState, Status } from "./types";

/** Total days of a stage's steps (unrounded), or null if it has none. */
export function stepDays(p: Project, key: StageKey): number | null {
  const steps = p.subs.filter((x) => x.stage === key);
  if (!steps.length) return null;
  // Rounded to tenths so 0.5 + 0.5 + … doesn't pick up float error.
  return Math.round(steps.reduce((a, x) => a + (Number(x.days) || 0), 0) * 10) / 10;
}

/**
 * A stage's estimate as a whole number of working days, ≥ 0.
 * A stage with steps lasts the sum of their days, rounded up.
 */
export function est(p: Project, s: StageDef): number {
  const sum = stepDays(p, s.key);
  if (sum !== null) return Math.ceil(sum);
  return Math.max(0, Math.round(Number(p.stages[s.key].est) || 0));
}

/**
 * Plan one project, backward from its deadline. Each stage ends on its deadline (one the user
 * set, else the working day before the next stage starts) and starts `days` working days earlier.
 * Nothing depends on today, so the plan doesn't move on its own.
 */
export function planProject(p: Project): Plan {
  const plan = { due: {} } as Plan;
  let cursor = toWork(p.deadline);

  const place = (s: StageDef) => {
    const st = p.stages[s.key];
    const n = est(p, s);
    if (!n) {
      plan[s.key] = null;
      plan.due[s.key] = null;
      return;
    }
    // Verification's deadline is the project deadline.
    const end = st.due && s.key !== "verify" ? toWork(st.due) : cursor;
    const start = spanStart(end, n);
    plan.due[s.key] = end;
    plan[s.key] = shown(st, { start, end });
    cursor = prevWork(start);
  };

  const rev = [...STAGES].reverse();
  rev.filter((s) => s.phase === "post").forEach(place);
  plan.handoverBy = cursor;
  rev.filter((s) => s.phase === "pre").forEach(place);
  return plan;
}

/** A started stage starts when it started; a done stage shows its real dates. */
function shown(st: StageState, planned: Range): Range {
  if (st.status === "done") {
    const end = st.doneOn || planned.end;
    const start = st.startedOn || planned.start;
    return { start: start > end ? end : start, end };
  }
  if (st.status === "doing" && st.startedOn) {
    const start = firstWork(st.startedOn);
    return { start: start > planned.end ? planned.end : start, end: planned.end };
  }
  return planned;
}

/** Plans keyed by project id. */
export function planAll(projects: Project[]): Record<string, Plan> {
  const plans: Record<string, Plan> = {};
  for (const p of projects) plans[p.id] = planProject(p);
  return plans;
}

/**
 * Late = not done and: past its deadline, or not started and past its start, or (pre-dev)
 * running past "handover by".
 */
export const isLate = (
  s: StageDef,
  st: StageState,
  r: Range | null,
  plan: Plan,
  today: ISODate,
): boolean =>
  !!r &&
  st.status !== "done" &&
  (r.end < today ||
    (st.status === "todo" && r.start < today) ||
    (s.phase === "pre" && r.end > plan.handoverBy));

/** The first stage that isn't done and has days. */
export const current = (p: Project): StageDef | undefined =>
  STAGES.find((s) => p.stages[s.key].status !== "done" && est(p, s) > 0);

/** The stage whose planned range covers date. */
export const stageAt = (plan: Plan, date: ISODate): StageDef | undefined =>
  STAGES.find((s) => {
    const r = plan[s.key];
    return !!r && r.start <= date && date <= r.end;
  });

/** A stage with a new status, keeping startedOn / doneOn in step. */
export function setStatus(st: StageState, v: Status, today: ISODate): StageState {
  const { startedOn: was, doneOn: _done, ...rest } = st;
  const startedOn = was || today;
  if (v === "todo") return { ...rest, status: v };
  if (v === "doing") return { ...rest, status: v, startedOn };
  return { ...rest, status: v, startedOn, doneOn: today };
}

/** ✓ Done: mark the current stage done and start the next one. */
export function advance(p: Project, today: ISODate): Project {
  const cur = current(p);
  if (!cur) return p;
  const stages = { ...p.stages, [cur.key]: setStatus(p.stages[cur.key], "done", today) };
  const nxt = STAGES.slice(STAGES.indexOf(cur) + 1).find((s) => est(p, s) > 0);
  if (nxt && stages[nxt.key].status === "todo") {
    stages[nxt.key] = setStatus(stages[nxt.key], "doing", today);
  }
  return { ...p, stages };
}
