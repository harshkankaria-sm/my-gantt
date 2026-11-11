// Planning engine, ported from planAll() in prototype.html.
// Pure: `today` is always passed in, and nothing here mutates its inputs.

import { firstWork, nextWork, prevWork, spanEnd, toWork, type ISODate } from "./dates";
import { STAGES, type StageDef } from "./stages";
import type { Plan, Project, Range, StageState, Status } from "./types";

/** A stage's estimate as a whole number of working days, ≥ 0. */
export const est = (p: Project, s: StageDef): number =>
  Math.max(0, Math.round(Number(p.stages[s.key].est) || 0));

/** Plan one project. Each project is planned on its own. */
export function planProject(p: Project, todayRaw: ISODate): Plan {
  const today = firstWork(todayRaw);
  const plan = {} as Plan;

  // Post-dev: backward from the deadline.
  let end = toWork(p.deadline);
  for (const s of STAGES.filter((s) => s.phase === "post").reverse()) {
    const n = est(p, s);
    if (!n) {
      plan[s.key] = null;
      continue;
    }
    let start = end;
    for (let c = 1; c < n; c++) start = prevWork(start);
    plan[s.key] = { start, end };
    end = prevWork(start);
  }
  plan.handoverBy = end;

  // Pre-dev: forward from today. Started or done stages stay on their real dates.
  let cursor = today;
  for (const s of STAGES.filter((s) => s.phase === "pre")) {
    const st = p.stages[s.key];
    const n = est(p, s);
    if (!n) {
      plan[s.key] = null;
      continue;
    }
    let start: ISODate;
    let e: ISODate;
    if (st.status === "done") {
      e = st.doneOn || prevWork(today);
      start = st.startedOn || e;
    } else if (st.status === "doing" && st.startedOn) {
      start = firstWork(st.startedOn);
      e = spanEnd(start, n);
    } else {
      start = cursor < today ? today : cursor;
      e = spanEnd(start, n);
    }
    plan[s.key] = { start, end: e };
    cursor = nextWork(e);
  }

  return plan;
}

/** Plans keyed by project id. */
export function planAll(projects: Project[], today: ISODate): Record<string, Plan> {
  const plans: Record<string, Plan> = {};
  for (const p of projects) plans[p.id] = planProject(p, today);
  return plans;
}

/** Late = not done and either past its end, or (pre-dev) running past "handover by". */
export const isLate = (
  s: StageDef,
  st: StageState,
  r: Range | null,
  plan: Plan,
  today: ISODate,
): boolean =>
  !!r && st.status !== "done" && (r.end < today || (s.phase === "pre" && r.end > plan.handoverBy));

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
  const days = st.est;
  const startedOn = st.startedOn || today;
  if (v === "todo") return { est: days, status: v };
  if (v === "doing") return { est: days, status: v, startedOn };
  return { est: days, status: v, startedOn, doneOn: today };
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
