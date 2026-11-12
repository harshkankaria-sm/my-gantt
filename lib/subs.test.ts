import { describe, expect, it } from "vitest";
import { addSub, editSub, newSub, removeSub, setGroupOpen, toggleExpanded } from "./edit";
import { advance, planProject } from "./plan";
import { stageDef } from "./stages";
import { makeProject, uid } from "./store";
import { groupItems, groupOpen, subSpot } from "./subs";
import type { Project, SubMilestone } from "./types";

// Nov 2026: Mondays are 9, 16, 23, 30. Today is Wed 11 Nov.
// Default plan due 30 Nov: PRD 11–17 · Dev 18–24.
const TODAY = "2026-11-11";
const LO = "2026-11-02";

const dev = (name: string, days: number, done = false): SubMilestone => ({
  id: uid(),
  name,
  stage: "dev",
  days,
  done,
});

// Default PRD steps 0.5 · 1 · 1 · 2 · 0.5 = 5 days: 11, 12, 13, 16, 17 Nov.
const proj = (): Project => makeProject("Test", "2026-11-30");

describe("subSpot", () => {
  it("runs steps one after another; each sits where it ends, in its stage's colour", () => {
    const p = proj();
    const plan = planProject(p, TODAY);
    // x from LO: 11 Nov is 9. Mid-day ends sit at +0.25, whole-day ends at +0.75.
    expect(p.subs.map((s) => subSpot(p, plan, s, LO, TODAY)!.x)).toEqual([9.25, 10.25, 11.25, 15.25, 15.75]);
    expect(p.subs.map((s) => subSpot(p, plan, s, LO, TODAY)!.end)).toEqual([
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-17",
      "2026-11-17",
    ]);
    expect(subSpot(p, plan, p.subs[0], LO, TODAY)?.color).toBe(stageDef("prd").color);
  });

  it("places dev items from dev's start", () => {
    const p = proj();
    const [a, b] = [dev("API", 3), dev("Pages", 2)];
    p.subs.push(a, b); // dev = 5 days: 18–24 Nov
    const plan = planProject(p, TODAY);
    expect(subSpot(p, plan, a, LO, TODAY)?.end).toBe("2026-11-20");
    expect(subSpot(p, plan, b, LO, TODAY)?.end).toBe("2026-11-24");
  });

  it("stops at a done stage's real end", () => {
    const p = proj();
    p.stages.prd = { est: 5, status: "done", startedOn: "2026-11-09", doneOn: "2026-11-10" };
    const plan = planProject(p, TODAY);
    expect(subSpot(p, plan, p.subs[4], LO, TODAY)?.end).toBe("2026-11-10");
  });

  it("is late when not done and past its end", () => {
    const p = proj();
    const plan = planProject(p, TODAY);
    expect(subSpot(p, plan, p.subs[0], LO, "2026-11-12")?.late).toBe(true);
    expect(subSpot(p, plan, p.subs[1], LO, "2026-11-12")?.late).toBe(false);
    p.subs[0].done = true;
    expect(subSpot(p, plan, p.subs[0], LO, "2026-11-12")?.late).toBe(false);
  });
});

describe("groups", () => {
  it("lists a group's items in list order", () => {
    const p = proj();
    p.subs.push(dev("B", 1), dev("A", 2));
    expect(groupItems(p, "dev").map((s) => s.name)).toEqual(["B", "A"]);
  });

  it("opens only the current stage's group by default", () => {
    const p = proj();
    expect(groupOpen(p, "prd")).toBe(true);
    expect(groupOpen(p, "dev")).toBe(false);
    const later = { ...p, stages: { ...p.stages } };
    for (const k of ["prd", "review", "solution", "handover"] as const) {
      later.stages[k] = { ...later.stages[k], status: "done" };
    }
    expect(groupOpen(later, "dev")).toBe(true);
    expect(groupOpen(later, "prd")).toBe(false);
  });

  it("remembers the user's choice per project", () => {
    const p = setGroupOpen(proj(), "prd", false);
    expect(groupOpen(p, "prd")).toBe(false);
    expect(groupOpen(advance(p, TODAY), "prd")).toBe(false);
    expect(groupOpen(setGroupOpen(p, "dev", true), "dev")).toBe(true);
  });
});

describe("sub-milestone edits", () => {
  it("toggles the checklist", () => {
    const p = proj();
    expect(toggleExpanded(p).expanded).toBe(true);
    expect(p.expanded).toBe(false);
  });

  it("adds a 1-day step", () => {
    expect(newSub("dev")).toMatchObject({ stage: "dev", days: 1, done: false });
  });

  it("ticks, renames, re-sizes and removes one item", () => {
    const p0 = proj();
    const sub = newSub("dev");
    const p = addSub(p0, sub);
    expect(p.subs).toHaveLength(6);
    const edited = editSub(p, sub.id, (s) => ({ ...s, done: true, name: "API", days: 3 }));
    expect(edited.subs.at(-1)).toEqual({ ...sub, done: true, name: "API", days: 3 });
    expect(edited.subs[0]).toBe(p.subs[0]);
    expect(removeSub(edited, sub.id).subs).toHaveLength(5);
  });
});
