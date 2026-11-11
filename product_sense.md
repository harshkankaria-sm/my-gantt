# Product Sense — My Gantt

> When a new project comes in, turn its deadline into a plan in about 5 minutes, and see how it sits next to my other projects.

- **Owner:** Harsh (APM)
- **Written:** 11 Nov 2026
- **Status:** Draft v5. The deadline is the only date I enter; the tool doesn't shift one project because of another

---

## 1. Context & goal

New projects come in with a deadline and follow the same company SOP:

PRD → review → solutioning with tech heads → handover call with devs → dev → QA → release → verification.

I control the stages before dev. Dev and everything after belong to others, and my role there is coordination.

**Goal:** when a project comes in, I set its deadline and the tool lays out the whole plan. I spend about 5 minutes adjusting it, and I can see when I must hand over to dev and how it sits next to my other projects.

**Current projects** (the result of running this flow three times), all due 30 Nov 2026:

| Priority | Project | PRD |
|---|---|---|
| 1 | Horoscope feature live on web | Problem framing done · 2 days left |
| 2 | SEO tech fixes | Problem framing and research done · 1 day left |
| 3 | Website analytics fixes | Problem framing done · 2 days left |

---

## 2. User

**Me, an APM, still learning how long things take here.** I'm the only user. The tool is for my own planning and sense of urgency.

---

## 3. Pain points

1. **P1 (main): When a new project comes in, I can't quickly turn its deadline into a plan.** I need all the SOP steps laid out, how long each takes, how much time I have before dev must start, and how the project sits next to my other projects, in about 5 minutes.
2. **P2: Once planned, I lose track of where each project stands against the plan.** I need to see what's late, and progress inside a stage (PRD steps, dev items).

---

## 4. Jobs to be done

| When… | I want to… | So that… |
|-------|-----------|----------|
| A new project comes in | enter a name and deadline and get the full plan | I don't build it from scratch |
| I set it up | adjust stage days and mark what's already done | the plan reflects reality in about 5 minutes |
| I look at the plan | see whether it fits before "handover by", next to my other projects | I know where I stand |
| I finish a stage | mark it done in one click | the plan stays current |
| I work inside a stage | see only the current stage's sub-milestones and tick them off | I focus on what I'm doing now and know how much is left |
| I plan | open other stages' sub-milestones when I need them | I can tell which item belongs to which stage |
| I read the timeline | see the weekday of each date | I can tell weekends (planned as gaps) from real gaps |

---

## 5. Planning model

The timeline has two halves joined by one date per project.

| Half | Stages | Planned |
|---|---|---|
| **Pre-dev** (mine) | PRD finalise → PRD review → Solutioning → Handover call | **Forward from today**. Stages already started or done stay on their real dates |
| **Post-dev** (others') | Dev → QA / UAT → Release → Verification | **Backward from the deadline** |

**Handover by** = the working day before dev must start. It's the deadline for everything I control.

### Rules

1. Plans use working days (Mon–Fri). Each stage has one estimate, including any time spent waiting on others.
2. Each project is planned on its own. The tool never moves one project because of another.
3. The only date I enter is the deadline. Stages not yet started are planned from today, so marking a stage done re-plans the rest from today.
4. A pre-dev stage running past "handover by", or a stage past its end date and not done, shows red. There's no separate warning.
5. Priority only sets the row order.

### New project setup

1. **+ New project** → name and deadline.
2. The tool adds all 8 stages with default days and the 4 PRD steps (problem framing, research, solution & scope, metrics & tracking).
3. In the same panel I set the priority, stage days and the status of anything already done.
4. The timeline updates live behind the panel.

---

## 6. MVP scope

### In (each item traced to a pain point in §3)

| Element | Serves |
|---|---|
| + New project → name + deadline; stages and PRD steps added automatically | P1 |
| Setup/edit panel: deadline, priority (row order), days and status per stage | P1 |
| Planning: pre-dev forward from today; post-dev backward from deadline | P1 |
| Live update while editing | P1 |
| Timeline: one row per project, bar split into stage segments; stage legend | P1, P2 |
| Today line, "Handover by" line, deadline line | P1, P2 |
| Weekday initial (M T W…) above each date in the header | P1: weekends show as gaps, so I need to see which days are weekends |
| Late stage in red | P2 |
| One-click "✓ Done" on the current stage; re-plans from today | P2 |
| Sub-milestones (PRD steps, dev items): diamonds under the bar, expandable checklist | P2 |
| Checklist grouped by stage (PRD finalise, Dev), with a collapsible header per group. The current stage's group is open by default and the others are collapsed. A collapsed group still shows its diamonds on its header row; "+ Add" sits inside each group | P2 (focus on current stage), P1 (other stages while planning) |
| Saved in the browser (localStorage) | Required by all of the above |

### Out

- **Drag to resize or move bars:** planned for after the MVP; it would replace the setup panel.
- **Removed earlier:** done count ("1/4") on collapsed sub-milestone groups; start date input; automatic shifting of projects to avoid clashes; delete or archive project; sample/starter project (the app starts empty); hover tooltips on buttons; stage due date text in the panel; showing clashes; overflow warning; health chips; focus strip; per-row status badge; date text next to diamonds; subtitles, counters and totals; estimate-vs-actual tracking; per-step estimates for PRD steps; different PRD steps per project type; reset, export or import; filters; list view; tags; sharing; Jira sync; backend.

New needs follow this order: add the pain point to §3 → ideate → add to scope → build.

---

## 7. Success metrics

- Setting up a new project takes ≤ 5 minutes.
- I always know each project's "handover by" date.
- All 3 current projects are handed over before their dev cutoff and live by 30 Nov, or any slip was visible days in advance.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Building the tool eats into delivery time | Keep the build small; nothing beyond §6 |
| Default estimates are guesses, especially waiting time | Editable at setup; tune the defaults after this cycle |
| I stop updating statuses | One-click "✓ Done" |

---

## 9. Open questions

- None open. Decided 11 Nov 2026: default stage days are PRD 2 · Review 1 · Solutioning 2 · Handover 1 · Dev 5 · QA 2 · Release 1 · Verify 1 (to tune after this cycle).
