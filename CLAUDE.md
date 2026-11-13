# My Gantt

A single-user planner: a new project's deadline becomes a stage-by-stage plan.

## Read first, every chat
1. `product_sense.md`: what and why. Pain points are in §3, planning rules in §5, and scope, with the pain point each element serves, in §6.
2. `PLAN.md`: how a change gets made, and how to deploy.
3. `lib/plan.ts` and `lib/subs.ts`: the planning logic. The app itself is the UI reference.

`history/` holds the decision log and the original build plan and prototype. It's reference only; don't follow it.

## Working agreement
- **Don't run Node, npm, npx, tests, builds or the dev server** unless the user asks in this chat. The exception: every change ends with a type check (`npx tsc --noEmit`), with any errors fixed. The user runs the app and reports fixes.
- Node lives at `~/.local/node/bin`. If `node` isn't found, prefix commands with `PATH="$HOME/.local/node/bin:$PATH"`.
- Commit, push or deploy only when the user asks. Log each change in `history/decisions.md`.

## Rules
- **Pain-point-first.** Build only what's in product_sense §6. No extra labels, subtitles, counters, tooltips, settings or buttons. If something seems needed, stop and propose it. The order is: pain point in §3 → ideate → add to §6 → build.
- **No new inputs or rules without an explicit yes.** The user enters the project deadline, and optionally a deadline per stage or step.
- Planning: every stage and step backward from the project deadline; a deadline the user sets stays put; nothing is planned from today; each project planned on its own; priority is row order only. Working days are Mon–Fri.
- No backend. State lives in `localStorage`, behind `lib/store.ts`.
- Keep the planning logic pure and in `lib/`, with Vitest test files (written, but run only when the user asks).
- Deployed on Vercel. Access `localStorage` only on the client, never during server render.

## Commands (the user runs these)
- `npm install` · `npm run dev` · `npm test` · `npm run build`
