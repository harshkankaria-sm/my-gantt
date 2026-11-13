# Decision log — My Gantt

History only. The current product is described in `../product_sense.md`; nothing here is a rule.

Archived alongside this file:
- `build-plan.md`: the original phase-by-phase build plan (Phases 0–6, all done 11 Nov 2026).
- `prototype.html`: the original HTML prototype. It plans pre-dev forward from today and uses a date per step, so it no longer matches the app.

## 11 Nov 2026 — First version (Phases 0–6)

- Built from the prototype: Next.js + TypeScript + Tailwind, state in `localStorage`, no backend.
- Planning: post-dev backward from the deadline; pre-dev forward from today; started/done stages kept on their real dates. "✓ Done" re-planned the rest from today.
- The deadline was the only date entered; sub-milestones had an optional date each.
- Default stage days: PRD 2 · Review 1 · Solutioning 2 · Handover 1 · Dev 5 · QA 2 · Release 1 · Verify 1.
- Deployed to Vercel with the CLI from the local folder (https://my-gantt-five.vercel.app).
- Removed during the build, as they served no pain point: done count ("1/4") on collapsed groups; start date input; automatic shifting of projects to avoid clashes; delete or archive project; sample/starter project; hover tooltips on buttons; stage due date text in the panel; showing clashes; overflow warning; health chips; focus strip; per-row status badge; date text next to diamonds; subtitles, counters and totals; estimate-vs-actual tracking; different PRD steps per project type.

## 12 Nov 2026 — Days per step

- PRD steps and dev items take days (0.5, 1, 2, 3, 5, 8, 13) instead of a date. A stage with steps lasts their sum, rounded up, and its days are read-only in the panel.
- Added a "Design" PRD step (2 days). PRD's default became 5, the sum of its steps; a new dev item starts at 1 day.
- Saved steps with dates were migrated to days on load.

## 13 Nov 2026 — Deadlines and days; weekends dimmed

- Problem: pre-dev stages not yet started were planned from today, so they slid forward every day, and a stage not started never looked late.
- Decided: work in deadlines and days. Every stage and step is planned backward from the project deadline. Deadlines are worked out by default; one the user sets stays put and the ones before it follow. Overlaps and gaps are allowed. Nothing is planned from today.
- New rule: a stage not started whose start has passed shows red.
- A stage with steps still lasts the sum of its steps; a step deadline set outside the stage's bar just shows there.
- New pain point P3: weekends looked like working days inside bars. Weekends are now dimmed, inside bars too.
