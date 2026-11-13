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
  /** Deadline the user set; it stays put. Without one, it's worked out backward from the project deadline. */
  due?: ISODate;
}

export interface SubMilestone {
  id: string;
  name: string;
  stage: SubStageKey;
  /** Working days, one of STEP_DAYS. Steps run one after another inside their stage. */
  days: number;
  done: boolean;
  /** Deadline the user set; it stays put. Without one, it's where the next step starts. */
  due?: ISODate;
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

/** A project's dates as shown. A stage with 0 days is null. */
export type Plan = Record<StageKey, Range | null> & {
  /** The working day before dev starts. */
  handoverBy: ISODate;
  /** Each stage's deadline (set or worked out); null for a stage with 0 days. */
  due: Record<StageKey, ISODate | null>;
};

/** Array order is priority (row order only). */
export interface AppState {
  projects: Project[];
}
