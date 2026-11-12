// Sub-milestones (steps): where their diamonds sit and how groups open. Pure.

import { diff, nextWork, type ISODate } from "./dates";
import { current } from "./plan";
import { stageDef } from "./stages";
import type { Plan, Project, SubMilestone, SubStageKey } from "./types";

export interface SubSpot {
  /** Position in days from the timeline's first day `lo` (fractional). */
  x: number;
  /** The working day the step ends on. */
  end: ISODate;
  color: string;
  late: boolean;
}

/**
 * Steps run one after another from their stage's start, in list order. A diamond sits where
 * its step ends: a step ending mid-day sits in the first half of that day, one ending on a
 * whole day in the second half. null when its stage is skipped.
 */
export function subSpot(
  p: Project,
  plan: Plan,
  sub: SubMilestone,
  lo: ISODate,
  today: ISODate,
): SubSpot | null {
  const r = plan[sub.stage];
  if (!r) return null;
  let cum = 0;
  for (const x of groupItems(p, sub.stage)) {
    cum += Number(x.days) || 0;
    if (x.id === sub.id) break;
  }
  cum = Math.round(cum * 10) / 10;
  const idx = Math.max(0, Math.ceil(cum) - 1);
  let end = r.start;
  // A done stage keeps its real dates, which may be shorter than its steps: stop at its end.
  for (let i = 0; i < idx && end < r.end; i++) end = nextWork(end);
  const frac = Math.min(1, Math.max(0, cum - idx));
  return {
    x: diff(lo, end) + (frac <= 0.5 ? 0.25 : 0.75),
    end,
    color: stageDef(sub.stage).color,
    late: !sub.done && end < today,
  };
}

/** A group's items, in list (and so plan) order. */
export const groupItems = (p: Project, k: SubStageKey): SubMilestone[] =>
  p.subs.filter((s) => s.stage === k);

/** Open if the user opened it; otherwise only the current stage's group is open. */
export const groupOpen = (p: Project, k: SubStageKey): boolean =>
  p.groups && k in p.groups ? !!p.groups[k] : current(p)?.key === k;
