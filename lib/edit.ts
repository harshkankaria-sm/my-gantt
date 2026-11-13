// Pure state edits used by the UI. Nothing here mutates its inputs.

import { addDays, toWork, type ISODate } from "./dates";
import { setStatus } from "./plan";
import { makeProject, uid } from "./store";
import { NEW_STEP_DAYS } from "./stages";
import type { AppState, Project, StageKey, Status, SubMilestone, SubStageKey } from "./types";

/** "+ New project": default stages and PRD steps, due 4 weeks from today. */
export const newProject = (today: ISODate): Project =>
  makeProject("New project", toWork(addDays(today, 28)));

/** New projects go last (lowest priority). */
export const addProject = (s: AppState, p: Project): AppState => ({
  projects: [...s.projects, p],
});

export const editProject = (s: AppState, id: string, fn: (p: Project) => Project): AppState => ({
  projects: s.projects.map((p) => (p.id === id ? fn(p) : p)),
});

/** Priority = row order only. Moves one project to index `to`. */
export function moveProject(s: AppState, id: string, to: number): AppState {
  const from = s.projects.findIndex((p) => p.id === id);
  if (from < 0) return s;
  const projects = [...s.projects];
  const [p] = projects.splice(from, 1);
  projects.splice(Math.max(0, Math.min(projects.length, to)), 0, p);
  return { projects };
}

/** Stage days: a whole number from 0 to 60. 0 skips the stage. */
export const clampDays = (v: number): number => Math.max(0, Math.min(60, Math.round(v || 0)));

export const setDays = (p: Project, k: StageKey, v: number): Project => ({
  ...p,
  stages: { ...p.stages, [k]: { ...p.stages[k], est: clampDays(v) } },
});

/** A stage's deadline. It stays put; "" clears it, so it's worked out again. Weekends move to Friday. */
export const setDue = (p: Project, k: StageKey, v: ISODate): Project => ({
  ...p,
  stages: { ...p.stages, [k]: { ...p.stages[k], due: v ? toWork(v) : undefined } },
});

export const setStageStatus = (p: Project, k: StageKey, v: Status, today: ISODate): Project => ({
  ...p,
  stages: { ...p.stages, [k]: setStatus(p.stages[k], v, today) },
});

// ---- Sub-milestones ----

/** ▶ on the row: show or hide the checklist. */
export const toggleExpanded = (p: Project): Project => ({ ...p, expanded: !p.expanded });

/** Remember a group's open/closed state for this project. */
export const setGroupOpen = (p: Project, k: SubStageKey, open: boolean): Project => ({
  ...p,
  groups: { ...p.groups, [k]: open },
});

/** "+ Add": a new step at the end of its stage, NEW_STEP_DAYS long. */
export const newSub = (k: SubStageKey): SubMilestone => ({
  id: uid(),
  name: "New milestone",
  stage: k,
  days: NEW_STEP_DAYS,
  done: false,
});

export const addSub = (p: Project, sub: SubMilestone): Project => ({ ...p, subs: [...p.subs, sub] });

export const editSub = (p: Project, id: string, fn: (s: SubMilestone) => SubMilestone): Project => ({
  ...p,
  subs: p.subs.map((s) => (s.id === id ? fn(s) : s)),
});

/** A step's deadline. It stays put; "" clears it, so it's worked out again. Weekends move to Friday. */
export const setSubDue = (p: Project, id: string, v: ISODate): Project =>
  editSub(p, id, (s) => ({ ...s, due: v ? toWork(v) : undefined }));

export const removeSub = (p: Project, id: string): Project => ({
  ...p,
  subs: p.subs.filter((s) => s.id !== id),
});
