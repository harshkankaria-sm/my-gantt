// Sub-milestones (steps): where their diamonds sit and how groups open. Pure.

import { diff, prevWork, toWork, type ISODate } from "./dates";
import { current } from "./plan";
import { stageDef } from "./stages";
import type { Plan, Project, SubMilestone, SubStageKey } from "./types";

export interface SubSpot {
  /** Position in days from the timeline's first day `lo` (fractional). */
  x: number;
  /** The working day the step ends on: its deadline. */
  end: ISODate;
  color: string;
  late: boolean;
}

/** A point in time: the middle (1) or end (2) of a working day. */
interface Point {
  date: ISODate;
  half: 1 | 2;
}

/** The point n half-days before pt, skipping weekends. */
function back(pt: Point, n: number): Point {
  let date = pt.date;
  let t = pt.half - n;
  while (t <= 0) {
    date = prevWork(date);
    t += 2;
  }
  return { date, half: t as 1 | 2 };
}

/**
 * Where each step of a stage ends. Steps run one after another, the last ending on the stage's
 * deadline. A step's end is its own deadline if the user set one (the end of that day), else
 * where the next step starts. Empty when the stage is skipped.
 */
export function stepEnds(p: Project, plan: Plan, k: SubStageKey): Map<string, Point> {
  const ends = new Map<string, Point>();
  const due = plan.due[k];
  if (!due) return ends;
  let cursor: Point = { date: due, half: 2 };
  for (const x of [...groupItems(p, k)].reverse()) {
    const end: Point = x.due ? { date: toWork(x.due), half: 2 } : cursor;
    ends.set(x.id, end);
    cursor = back(end, Math.round((Number(x.days) || 0) * 2));
  }
  return ends;
}

/**
 * A step's diamond sits where it ends: a step ending mid-day sits in the first half of that day,
 * one ending on a whole day in the second half. null when its stage is skipped.
 */
export function subSpot(
  p: Project,
  plan: Plan,
  sub: SubMilestone,
  lo: ISODate,
  today: ISODate,
): SubSpot | null {
  const end = stepEnds(p, plan, sub.stage).get(sub.id);
  if (!end) return null;
  return {
    x: diff(lo, end.date) + (end.half === 1 ? 0.25 : 0.75),
    end: end.date,
    color: stageDef(sub.stage).color,
    late: !sub.done && end.date < today,
  };
}

/** A group's items, in list (and so plan) order. */
export const groupItems = (p: Project, k: SubStageKey): SubMilestone[] =>
  p.subs.filter((s) => s.stage === k);

/** Open if the user opened it; otherwise only the current stage's group is open. */
export const groupOpen = (p: Project, k: SubStageKey): boolean =>
  p.groups && k in p.groups ? !!p.groups[k] : current(p)?.key === k;
