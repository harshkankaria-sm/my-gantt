// State lives in the browser's localStorage. Call load/save only on the client.

import type { ISODate } from "./dates";
import { NEW_STEP_DAYS, PRD_STEPS, STAGES } from "./stages";
import type { AppState, Project, StageKey, StageState, SubMilestone } from "./types";

const KEY = "mygantt.v1";

export const uid = (): string => Math.random().toString(36).slice(2, 9);

/** A project with all 8 stages at default days and the default PRD steps. */
export function makeProject(name: string, deadline: ISODate): Project {
  const stages = {} as Record<StageKey, StageState>;
  for (const s of STAGES) stages[s.key] = { est: s.est, status: "todo" };
  return {
    id: uid(),
    name,
    deadline,
    expanded: false,
    stages,
    subs: PRD_STEPS.map((d) => ({ id: uid(), name: d.name, stage: "prd", days: d.days, done: false })),
  };
}

/** Saved state, or no projects if there's none (or it can't be read). */
export function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s && Array.isArray(s.projects)) return migrate(s);
    }
  } catch {
    // fall through to empty
  }
  return { projects: [] };
}

/** Steps saved before days per step had a date instead: give them days (default by name, else 1). */
function migrate(s: AppState): AppState {
  const days = (x: SubMilestone & { due?: unknown }): number =>
    typeof x.days === "number" ? x.days : (PRD_STEPS.find((d) => d.name === x.name)?.days ?? NEW_STEP_DAYS);
  return {
    projects: s.projects.map((p) => ({
      ...p,
      subs: p.subs.map(({ due: _due, ...x }: SubMilestone & { due?: unknown }) => ({ ...x, days: days(x) })),
    })),
  };
}

export function save(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked: keep running in memory
  }
}

// ---- Client store, for React's useSyncExternalStore ----
// The server snapshot is null, so localStorage is only read in the browser.

let current: AppState | null = null;
const listeners = new Set<() => void>();

export const subscribe = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getSnapshot = (): AppState => (current ??= load());

export const getServerSnapshot = (): AppState | null => null;

/** Apply a change, save it and re-render. Every edit goes through here. */
export function update(fn: (s: AppState) => AppState): void {
  current = fn(getSnapshot());
  save(current);
  for (const l of listeners) l();
}
