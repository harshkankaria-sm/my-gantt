import { describe, expect, it } from "vitest";
import { addSub, editSub, newSub, removeSub, setGroupOpen, toggleExpanded } from "./edit";
import { advance, planProject } from "./plan";
import { stageDef } from "./stages";
import { makeProject, uid } from "./store";
import { groupItems, groupOpen, subSpot } from "./subs";
import type { Project, SubMilestone } from "./types";

// Nov 2026: Mondays are 9, 16, 23, 30. Today is Wed 11 Nov.
// Default plan due 30 Nov: PRD 11 · Review 12 · Solutioning 13–16 · Handover 17 · Dev 18–24.
const TODAY = "2026-11-11";
const LO = "2026-11-02";

const dev = (name: string, due: string | null, done = false): SubMilestone => ({
  id: uid(),
  name,
  stage: "dev",
  due,
  done,
});

// PRD pinned at 1 day so positions don't depend on the default.
const proj = (): Project => {
  const p = makeProject("Test", "2026-11-30");
  p.stages.prd.est = 1;
  return p;
};

describe("subSpot", () => {
  it("puts a dated item at the centre of its day, coloured by the stage it falls in", () => {
    const p = proj();
    const sub = dev("API", "2026-11-19");
    p.subs.push(sub);
    expect(subSpot(p, planProject(p, TODAY), sub, LO, TODAY)).toEqual({
      x: 17.5,
      color: stageDef("dev").color,
      late: false,
      step: false,
    });
  });

  it("is grey when the date falls outside every stage", () => {
    // (Weekends inside a stage's span count as that stage.)
    const p = proj();
    const sub = dev("After the deadline", "2026-12-03");
    p.subs.push(sub);
    expect(subSpot(p, planProject(p, TODAY), sub, LO, TODAY)?.color).toBe("#8d8d98");
  });

  it("spreads undated items evenly across their stage's segment", () => {
    const p = proj(); // 4 undated PRD steps; PRD is 11 Nov, 1 day → x 9..10
    const plan = planProject(p, TODAY);
    const xs = p.subs.map((s) => Math.round(subSpot(p, plan, s, LO, TODAY)!.x * 10) / 10);
    expect(xs).toEqual([9.2, 9.4, 9.6, 9.8]);
    expect(subSpot(p, plan, p.subs[0], LO, TODAY)?.step).toBe(true);
  });

  it("is late when not done and past its date (or its stage's end)", () => {
    const p = proj();
    const past = dev("Past", "2026-11-10");
    const pastDone = dev("Past done", "2026-11-10", true);
    p.subs.push(past, pastDone);
    const plan = planProject(p, TODAY);
    expect(subSpot(p, plan, past, LO, TODAY)?.late).toBe(true);
    expect(subSpot(p, plan, pastDone, LO, TODAY)?.late).toBe(false);
    expect(subSpot(p, plan, p.subs[0], LO, "2026-11-12")?.late).toBe(true);
  });

  it("has no spot when undated and its stage is skipped", () => {
    const p = proj();
    p.stages.prd.est = 0;
    expect(subSpot(p, planProject(p, TODAY), p.subs[0], LO, TODAY)).toBeNull();
  });
});

describe("groups", () => {
  it("lists a group's items in date order", () => {
    const p = proj();
    p.subs.push(dev("Late", "2026-11-23"), dev("Undated", null), dev("Early", "2026-11-19"));
    const names = groupItems(p, planProject(p, TODAY), "dev").map((s) => s.name);
    expect(names).toEqual(["Early", "Late", "Undated"]); // undated sits at dev's end, 24 Nov
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

  it("adds PRD steps undated and dev items on dev's end (or the deadline)", () => {
    const p = proj();
    const plan = planProject(p, TODAY);
    expect(newSub(p, plan, "prd").due).toBeNull();
    expect(newSub(p, plan, "dev").due).toBe("2026-11-24");
    p.stages.dev.est = 0;
    expect(newSub(p, planProject(p, TODAY), "dev").due).toBe("2026-11-30");
  });

  it("ticks, renames, re-dates and removes one item", () => {
    const p0 = proj();
    const sub = newSub(p0, planProject(p0, TODAY), "dev");
    const p = addSub(p0, sub);
    expect(p.subs).toHaveLength(5);
    const edited = editSub(p, sub.id, (s) => ({ ...s, done: true, name: "API", due: "2026-11-20" }));
    expect(edited.subs.at(-1)).toEqual({ ...sub, done: true, name: "API", due: "2026-11-20" });
    expect(edited.subs[0]).toBe(p.subs[0]);
    expect(removeSub(edited, sub.id).subs).toHaveLength(4);
  });
});
