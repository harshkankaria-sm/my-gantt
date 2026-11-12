import { describe, expect, it } from "vitest";
import { fmt, isWknd, nextWork, prevWork, spanEnd, diff } from "./dates";
import { advance, current, est, isLate, planAll, planProject, setStatus, stepDays } from "./plan";
import { stageDef } from "./stages";
import { makeProject, uid } from "./store";
import type { AppState, Project, StageKey } from "./types";

// Fixture: the 3 projects from product_sense §1, in priority order.
// PRD has no steps here, so its own days apply; dev items add up to dev's 5 days.
function fixtureProject(name: string, prdEst: number, devItems: [string, number][]): Project {
  const p = makeProject(name, "2026-11-30");
  p.stages.prd.est = prdEst;
  p.subs = devItems.map(([n, days]) => ({ id: uid(), name: n, stage: "dev" as const, days, done: false }));
  return p;
}

function seed(): AppState {
  const projects = [
    fixtureProject("Horoscope feature live on web", 2, [
      ["Horoscope API integration", 3],
      ["Daily / weekly / monthly pages", 2],
    ]),
    fixtureProject("SEO tech fixes", 1, [
      ["Canonical tags", 2],
      ["Sitemap cleanup", 2],
      ["Redirect chains", 1],
    ]),
    fixtureProject("Website analytics fixes", 2, [
      ["GA4 event mapping", 3],
      ["Conversion tracking", 2],
    ]),
  ];
  // Horoscope PRD is under way.
  projects[0].stages.prd = { ...projects[0].stages.prd, status: "doing", startedOn: "2026-11-11" };
  return { projects };
}

// Nov 2026: Mondays are 9, 16, 23, 30. Today is Wed 11 Nov.
const TODAY = "2026-11-11";

// Engine tests pin PRD at 1 day (no steps) so they don't depend on the default.
const proj = (edit?: (p: Project) => void): Project => {
  const p = makeProject("Test", "2026-11-30");
  p.subs = [];
  p.stages.prd.est = 1;
  edit?.(p);
  return p;
};

const range = (p: Project, k: StageKey, today = TODAY) => planProject(p, today)[k];

describe("working days", () => {
  it("skips weekends", () => {
    expect(isWknd("2026-11-14")).toBe(true);
    expect(isWknd("2026-11-16")).toBe(false);
    expect(nextWork("2026-11-13")).toBe("2026-11-16");
    expect(prevWork("2026-11-16")).toBe("2026-11-13");
    expect(spanEnd("2026-11-12", 3)).toBe("2026-11-16");
    expect(spanEnd("2026-11-12", 1)).toBe("2026-11-12");
  });

  it("formats and diffs", () => {
    expect(fmt("2026-11-30")).toBe("30 Nov");
    expect(diff("2026-11-11", "2026-11-30")).toBe(19);
  });
});

describe("stages with steps", () => {
  it("last the sum of their steps' days, rounded up", () => {
    const p = makeProject("Test", "2026-11-30"); // PRD steps 0.5 + 1 + 1 + 2 + 0.5
    expect(stepDays(p, "prd")).toBe(5);
    expect(est(p, stageDef("prd"))).toBe(5);
    p.subs[0].days = 1; // 5.5 → 6
    expect(est(p, stageDef("prd"))).toBe(6);
    expect(range(p, "prd")).toEqual({ start: "2026-11-11", end: "2026-11-18" });
  });

  it("use their own days when they have no steps", () => {
    const p = makeProject("Test", "2026-11-30");
    expect(stepDays(p, "dev")).toBeNull();
    expect(est(p, stageDef("dev"))).toBe(5);
    p.subs.push({ id: uid(), name: "API", stage: "dev", days: 2, done: false });
    expect(est(p, stageDef("dev"))).toBe(2);
    expect(range(p, "dev")).toEqual({ start: "2026-11-23", end: "2026-11-24" });
  });

  it("count done steps too", () => {
    const p = makeProject("Test", "2026-11-30");
    p.subs.forEach((s) => (s.done = true));
    expect(est(p, stageDef("prd"))).toBe(5);
  });
});

describe("post-dev: backward from the deadline", () => {
  it("lays out verify → release → QA → dev and sets handoverBy", () => {
    const plan = planProject(proj(), TODAY);
    expect(plan.verify).toEqual({ start: "2026-11-30", end: "2026-11-30" });
    expect(plan.release).toEqual({ start: "2026-11-27", end: "2026-11-27" });
    expect(plan.qa).toEqual({ start: "2026-11-25", end: "2026-11-26" });
    expect(plan.dev).toEqual({ start: "2026-11-18", end: "2026-11-24" });
    expect(plan.handoverBy).toBe("2026-11-17");
  });

  it("moves a weekend deadline back to Friday", () => {
    const plan = planProject(proj((p) => (p.deadline = "2026-11-29")), TODAY);
    expect(plan.verify).toEqual({ start: "2026-11-27", end: "2026-11-27" });
    expect(plan.dev).toEqual({ start: "2026-11-17", end: "2026-11-23" });
    expect(plan.handoverBy).toBe("2026-11-16");
  });

  it("skips a stage with 0 days", () => {
    const plan = planProject(proj((p) => (p.stages.qa.est = 0)), TODAY);
    expect(plan.qa).toBeNull();
    expect(plan.dev).toEqual({ start: "2026-11-20", end: "2026-11-26" });
    expect(plan.handoverBy).toBe("2026-11-19");
  });
});

describe("pre-dev: forward from today", () => {
  it("plans not-started stages from today", () => {
    const plan = planProject(proj(), TODAY);
    expect(plan.prd).toEqual({ start: "2026-11-11", end: "2026-11-11" });
    expect(plan.review).toEqual({ start: "2026-11-12", end: "2026-11-12" });
    expect(plan.solution).toEqual({ start: "2026-11-13", end: "2026-11-16" });
    expect(plan.handover).toEqual({ start: "2026-11-17", end: "2026-11-17" });
  });

  it("starts on Monday when today is a weekend", () => {
    const plan = planProject(proj(), "2026-11-14");
    expect(plan.prd).toEqual({ start: "2026-11-16", end: "2026-11-16" });
    expect(plan.handover).toEqual({ start: "2026-11-20", end: "2026-11-20" });
  });

  it("skips a stage with 0 days", () => {
    const plan = planProject(proj((p) => (p.stages.review.est = 0)), TODAY);
    expect(plan.review).toBeNull();
    expect(plan.solution).toEqual({ start: "2026-11-12", end: "2026-11-13" });
  });
});

describe("done / doing anchoring", () => {
  it("keeps a doing stage on its start date", () => {
    const p = proj((p) => {
      p.stages.prd = { est: 2, status: "doing", startedOn: "2026-11-09" };
    });
    expect(range(p, "prd")).toEqual({ start: "2026-11-09", end: "2026-11-10" });
    expect(range(p, "review")).toEqual({ start: "2026-11-11", end: "2026-11-11" });
  });

  it("starts the next stage no earlier than today", () => {
    const p = proj((p) => {
      p.stages.prd = { est: 2, status: "doing", startedOn: "2026-11-05" };
    });
    expect(range(p, "prd")).toEqual({ start: "2026-11-05", end: "2026-11-06" });
    expect(range(p, "review")).toEqual({ start: "2026-11-11", end: "2026-11-11" });
  });

  it("plans a doing stage with no start date from today", () => {
    const p = proj((p) => (p.stages.prd.status = "doing"));
    expect(range(p, "prd")).toEqual({ start: "2026-11-11", end: "2026-11-11" });
  });

  it("keeps a done stage on its real dates", () => {
    const p = proj((p) => {
      p.stages.prd = { est: 3, status: "done", startedOn: "2026-11-05", doneOn: "2026-11-06" };
    });
    expect(range(p, "prd")).toEqual({ start: "2026-11-05", end: "2026-11-06" });
    expect(range(p, "review")).toEqual({ start: "2026-11-11", end: "2026-11-11" });
  });

  it("puts a done stage with no dates on the working day before today", () => {
    const p = proj((p) => (p.stages.prd.status = "done"));
    expect(range(p, "prd")).toEqual({ start: "2026-11-10", end: "2026-11-10" });
    expect(range(p, "review")).toEqual({ start: "2026-11-11", end: "2026-11-11" });
  });
});

describe("late", () => {
  const late = (p: Project, k: StageKey, today = TODAY) => {
    const plan = planProject(p, today);
    return isLate(stageDef(k), p.stages[k], plan[k], plan, today);
  };

  it("is not late when pre-dev ends on handoverBy", () => {
    expect(late(proj(), "handover")).toBe(false);
  });

  it("is late when pre-dev runs past handoverBy", () => {
    const p = proj((p) => (p.stages.solution.est = 3));
    expect(late(p, "handover")).toBe(true);
  });

  it("is late when a stage is past its end and not done", () => {
    const p = proj((p) => {
      p.stages.prd = { est: 2, status: "doing", startedOn: "2026-11-05" };
    });
    expect(late(p, "prd")).toBe(true);
    expect(late(proj(), "verify", "2026-12-01")).toBe(true);
  });

  it("is never late once done", () => {
    const p = proj((p) => {
      p.stages.prd = { est: 2, status: "done", startedOn: "2026-11-05", doneOn: "2026-11-06" };
    });
    expect(late(p, "prd")).toBe(false);
  });

  it("is not late for a 0-day stage", () => {
    expect(late(proj((p) => (p.stages.qa.est = 0)), "qa")).toBe(false);
  });
});

describe("advance (✓ Done)", () => {
  it("marks the current stage done and starts the next", () => {
    const p = seed().projects[0];
    const next = advance(p, "2026-11-12");
    expect(next.stages.prd).toEqual({
      est: 2,
      status: "done",
      startedOn: "2026-11-11",
      doneOn: "2026-11-12",
    });
    expect(next.stages.review).toEqual({ est: 1, status: "doing", startedOn: "2026-11-12" });
    expect(current(next)?.key).toBe("review");
    expect(p.stages.prd.status).toBe("doing"); // input untouched
  });

  it("skips stages with 0 days", () => {
    const next = advance(proj((p) => (p.stages.review.est = 0)), TODAY);
    expect(next.stages.prd.status).toBe("done");
    expect(next.stages.review.status).toBe("todo");
    expect(next.stages.solution.status).toBe("doing");
  });

  it("re-plans pre-dev from today", () => {
    const next = advance(proj(), TODAY);
    expect(range(next, "review")).toEqual({ start: "2026-11-11", end: "2026-11-11" });
    expect(range(next, "solution")).toEqual({ start: "2026-11-12", end: "2026-11-13" });
  });

  it("does nothing when every stage is done", () => {
    const p = proj((p) => {
      for (const k of Object.keys(p.stages) as StageKey[]) p.stages[k].status = "done";
    });
    expect(current(p)).toBeUndefined();
    expect(advance(p, TODAY)).toBe(p);
  });
});

describe("setStatus", () => {
  it("keeps startedOn / doneOn in step", () => {
    expect(setStatus({ est: 1, status: "done", startedOn: "2026-11-05", doneOn: "2026-11-06" }, "todo", TODAY))
      .toEqual({ est: 1, status: "todo" });
    expect(setStatus({ est: 1, status: "todo" }, "doing", TODAY))
      .toEqual({ est: 1, status: "doing", startedOn: TODAY });
    expect(setStatus({ est: 1, status: "doing", startedOn: "2026-11-09" }, "done", TODAY))
      .toEqual({ est: 1, status: "done", startedOn: "2026-11-09", doneOn: TODAY });
  });
});

describe("each project planned on its own", () => {
  it("row order doesn't change any project's dates", () => {
    const [a, b, c] = seed().projects;
    const one = planAll([a, b, c], TODAY);
    const two = planAll([c, a, b], TODAY);
    for (const p of [a, b, c]) {
      expect(two[p.id]).toEqual(one[p.id]);
      expect(one[p.id]).toEqual(planProject(p, TODAY));
    }
  });
});

describe("seed data", () => {
  it("Horoscope: PRD 11–12 Nov, handover 18 Nov, handoverBy 17 Nov", () => {
    const plan = planProject(seed().projects[0], TODAY);
    expect(plan.prd).toEqual({ start: "2026-11-11", end: "2026-11-12" });
    expect(plan.handover).toEqual({ start: "2026-11-18", end: "2026-11-18" });
    expect(plan.handoverBy).toBe("2026-11-17");
  });
});
