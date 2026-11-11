import { describe, expect, it } from "vitest";
import { addProject, clampDays, editProject, moveProject, newProject, setDays, setStageStatus } from "./edit";
import { planAll } from "./plan";
import { makeProject } from "./store";
import type { AppState } from "./types";

const TODAY = "2026-11-11";

const three = (): AppState => ({
  projects: [
    makeProject("A", "2026-11-30"),
    makeProject("B", "2026-12-04"),
    makeProject("C", "2026-12-11"),
  ],
});

describe("newProject", () => {
  it("has all 8 stages at default days, the 4 PRD steps, and is due in 4 weeks", () => {
    const p = newProject(TODAY);
    expect(p.name).toBe("New project");
    expect(p.deadline).toBe("2026-12-09");
    expect(Object.keys(p.stages)).toHaveLength(8);
    expect(p.stages.prd).toEqual({ est: 2, status: "todo" });
    expect(p.stages.dev).toEqual({ est: 5, status: "todo" });
    expect(p.subs.map((s) => s.name)).toEqual([
      "Problem framing",
      "Research",
      "Solution & scope",
      "Metrics & tracking",
    ]);
  });

  it("moves a weekend due date back to Friday", () => {
    expect(newProject("2026-11-15").deadline).toBe("2026-12-11");
  });

  it("is added last", () => {
    const s = three();
    const p = newProject(TODAY);
    expect(addProject(s, p).projects.at(-1)).toBe(p);
    expect(s.projects).toHaveLength(3);
  });
});

describe("moveProject (priority)", () => {
  it("changes row order only", () => {
    const s = three();
    const [a, b, c] = s.projects;
    const moved = moveProject(s, c.id, 0);
    expect(moved.projects.map((p) => p.name)).toEqual(["C", "A", "B"]);
    expect(moveProject(s, a.id, 2).projects.map((p) => p.name)).toEqual(["B", "C", "A"]);
    expect(moveProject(s, b.id, 1)).toEqual(s);
  });

  it("never moves any project's dates", () => {
    const s = three();
    const before = planAll(s.projects, TODAY);
    const after = planAll(moveProject(s, s.projects[2].id, 0).projects, TODAY);
    expect(after).toEqual(before);
  });

  it("ignores an unknown id", () => {
    const s = three();
    expect(moveProject(s, "nope", 0)).toBe(s);
  });
});

describe("stage edits", () => {
  it("clamps days to a whole number from 0 to 60", () => {
    expect(clampDays(2.6)).toBe(3);
    expect(clampDays(-1)).toBe(0);
    expect(clampDays(99)).toBe(60);
    expect(clampDays(NaN)).toBe(0);
  });

  it("sets days and status on one project without touching others", () => {
    const s = three();
    const id = s.projects[1].id;
    const next = editProject(s, id, (p) => setStageStatus(setDays(p, "prd", 3), "prd", "doing", TODAY));
    expect(next.projects[1].stages.prd).toEqual({ est: 3, status: "doing", startedOn: TODAY });
    expect(next.projects[0]).toBe(s.projects[0]);
    expect(s.projects[1].stages.prd).toEqual({ est: 2, status: "todo" });
  });
});
