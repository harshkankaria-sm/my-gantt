import type { ISODate } from "./dates";

export type StageKey =
  | "prd"
  | "review"
  | "solution"
  | "handover"
  | "dev"
  | "qa"
  | "release"
  | "verify";

/** Stages that carry sub-milestones. */
export type SubStageKey = "prd" | "dev";

export type Status = "todo" | "doing" | "done";

export interface StageState {
  /** Working days. */
  est: number;
  status: Status;
  startedOn?: ISODate;
  doneOn?: ISODate;
}

export interface SubMilestone {
  id: string;
  name: string;
  stage: SubStageKey;
  due: ISODate | null;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  deadline: ISODate;
  /** Sub-milestone checklist shown. */
  expanded: boolean;
  /** Open/closed per sub-milestone group, once the user has toggled it. */
  groups?: Partial<Record<SubStageKey, boolean>>;
  stages: Record<StageKey, StageState>;
  subs: SubMilestone[];
}

export interface Range {
  start: ISODate;
  end: ISODate;
}

/** A project's planned dates. A stage with 0 days is null. */
export type Plan = Record<StageKey, Range | null> & {
  /** The working day before dev starts. */
  handoverBy: ISODate;
};

/** Array order is priority (row order only). */
export interface AppState {
  projects: Project[];
}
