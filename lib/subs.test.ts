import { describe, expect, it } from "vitest";
import { addSub, editSub, newSub, removeSub, setGroupOpen, setSubDue, toggleExpanded } from "./edit";
import { advance, planProject } from "./plan";
import { stageDef } from "./stages";
import { makeProject, uid } from "./store";
import { groupItems, groupOpen, subSpot } from "./subs";
import type { Project, SubMilestone } from "./types";

// Nov 2026: Mondays are 2, 9, 16, 23, 30. Today is Wed 11 Nov.
// Default plan due 30 Nov: PRD 5–11 · Dev 18–24.
const TODAY = "2026-11-11";
const LO = "2026-11-02";

const dev = (name: string, days: number, done = false): SubMilestone => ({
  id: uid(),
  name,
  stage: "dev",
  days,
  done,
});

// Default PRD steps 0.5 · 1 · 1 · 2 · 0.5 = 5 days, back from the end of 11 Nov.
const proj = (): Project => makeProject("Test", "2026-11-30");

describe("subSpot", () => {
  it("runs steps back from the stage's deadline; each sits where it ends, in its stage's colour", () => {
    const p = proj();
    const plan = planProject(p);
    // x from LO: 5 Nov is 3. Mid-day ends sit at +0.25, whole-day ends at +0.75.
    expect(p.subs.map((s) => subSpot(p, plan, s, LO, TODAY)!.x)).toEqual([3.25, 4.25, 7.25, 9.25, 9.75]);
    expect(p.subs.map((s) => subSpot(p, plan, s, LO, TODAY)!.end)).toEqual([
      "2026-11-05",
      "2026-11-06",
      "2026-11-09",
      "2026-11-11",
      "2026-11-11",
    ]);
    expect(subSpot(p, plan, p.subs[0], LO, TODAY)?.color).toBe(stageDef("prd").color);
  });

  it("places dev items back from dev's deadline", () => {
    const p = proj();
    const [a, b] = [dev("API", 3), dev("Pages", 2)];
    p.subs.push(a, b); // dev = 5 days: 18–24 Nov
    const plan = planProject(p);
    expect(subSpot(p, plan, a, LO, TODAY)?.end).toBe("2026-11-20");
    expect(subSpot(p, plan, b, LO, TODAY)?.end).toBe("2026-11-24");
  });

  it("keeps a step deadline the user set; the steps before follow it", () => {
    const p = proj();
    p.subs[1].due = "2026-11-13"; // Research
    const plan = planProject(p);
    const end = (i: number) => subSpot(p, plan, p.subs[i], LO, TODAY)?.end;
    expect(end(1)).toBe("2026-11-13");
    expect(subSpot(p, plan, p.subs[1], LO, TODAY)?.x).toBe(11.75);
    expect(end(0)).toBe("2026-11-12");
    expect(end(3)).toBe("2026-11-11");
    expect(end(2)).toBe("2026-11-09");
  });

  it("uses the stage's deadline, not a done stage's real dates", () => {
    const p = proj();
    p.stages.prd = { est: 5, status: "done", startedOn: "2026-11-09", doneOn: "2026-11-10" };
    const plan = planProject(p);
    expect(subSpot(p, plan, p.subs[4], LO, TODAY)?.end).toBe("2026-11-11");
  });

  it("is late when not done and past its deadline", () => {
    const p = proj();
    const plan = planProject(p);
    expect(subSpot(p, plan, p.subs[0], LO, "2026-11-06")?.late).toBe(true);
    expect(subSpot(p, plan, p.subs[1], LO, "2026-11-06")?.late).toBe(false);
    p.subs[0].done = true;
    expect(subSpot(p, plan, p.subs[0], LO, "2026-11-06")?.late).toBe(false);
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

  it("sets and clears a step's deadline; a weekend moves to Friday", () => {
    const p = proj();
    const id = p.subs[0].id;
    const set = setSubDue(p, id, "2026-11-15");
    expect(set.subs[0].due).toBe("2026-11-13");
    expect(setSubDue(set, id, "").subs[0].due).toBeUndefined();
  });
});
