// Sub-milestones: where their diamonds sit and how groups open. Pure, ported from prototype.html.

import { diff, type ISODate } from "./dates";
import { current, stageAt } from "./plan";
import { stageDef } from "./stages";
import type { Plan, Project, SubMilestone, SubStageKey } from "./types";

/** Diamond colour for a dated item that falls outside every stage (e.g. a weekend gap). */
const NO_STAGE = "#8d8d98";

export interface SubSpot {
  /** Position in days from the timeline's first day `lo` (fractional). */
  x: number;
  color: string;
  late: boolean;
  /** No date: spread across its stage's segment (drawn smaller). */
  step: boolean;
}

/**
 * A diamond sits at the item's date (centre of the day), or, with no date, spread evenly
 * across its stage's segment. null when it has no date and its stage is skipped (0 days).
 */
export function subSpot(
  p: Project,
  plan: Plan,
  sub: SubMilestone,
  lo: ISODate,
  today: ISODate,
): SubSpot | null {
  if (sub.due) {
    return {
      x: diff(lo, sub.due) + 0.5,
      color: stageAt(plan, sub.due)?.color ?? NO_STAGE,
      late: !sub.done && sub.due < today,
      step: false,
    };
  }
  const r = plan[sub.stage];
  if (!r) return null;
  const sibs = p.subs.filter((s) => !s.due && s.stage === sub.stage);
  const i = sibs.findIndex((s) => s.id === sub.id);
  const span = diff(r.start, r.end) + 1;
  return {
    x: diff(lo, r.start) + (span * (i + 1)) / (sibs.length + 1),
    color: stageDef(sub.stage).color,
    late: !sub.done && r.end < today,
    step: true,
  };
}

/** Sort key: its date, else its stage's end. Items of a skipped stage go last. */
const when = (plan: Plan, sub: SubMilestone): ISODate =>
  sub.due ?? plan[sub.stage]?.end ?? "9999-12-31";

/** A group's items, in date order. */
export const groupItems = (p: Project, plan: Plan, k: SubStageKey): SubMilestone[] =>
  p.subs.filter((s) => s.stage === k).sort((a, b) => when(plan, a).localeCompare(when(plan, b)));

/** Open if the user opened it; otherwise only the current stage's group is open. */
export const groupOpen = (p: Project, k: SubStageKey): boolean =>
  p.groups && k in p.groups ? !!p.groups[k] : current(p)?.key === k;
