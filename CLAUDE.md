# My Gantt

A single-user planner: a new project's deadline becomes a stage-by-stage plan.

## Read first, every chat
1. `product_sense.md`: what and why. Pain points are in §3; scope, with the pain point each element serves, is in §6.
2. `PLAN.md`: build phases. Work only on the phase you were asked to start, and tick it off in the tracker when it's done.
3. `prototype.html`: the reference for UI, UX and planning logic (`planAll()`). Match it unless product_sense says otherwise.

## Working agreement
- **Don't run Node, npm, npx, tests, builds or the dev server** unless the user asks in this chat. The exceptions: Phase 0 runs `create-next-app` and `npm install`, and every phase ends with a type check (`npx tsc --noEmit`), with any errors fixed. The user runs the app and reports fixes.
- Node lives at `~/.local/node/bin`. If `node` isn't found, prefix commands with `PATH="$HOME/.local/node/bin:$PATH"`.
- Commit or push only when the user asks.

## Rules
- **Pain-point-first.** Build only what's in product_sense §6. No extra labels, subtitles, counters, tooltips, settings or buttons. If something seems needed, stop and propose it. The order is: pain point in §3 → ideate → add to §6 → build.
- **No new inputs or rules without an explicit yes.** The deadline is the only date the user enters.
- Planning: post-dev backward from the deadline; pre-dev forward from today; each project planned on its own; priority is row order only. Working days are Mon–Fri.
- No backend. State lives in `localStorage`, behind `lib/store.ts`.
- Keep the planning logic pure and in `lib/`, with Vitest test files (written, but run only when the user asks).
- Deployed on Vercel. Access `localStorage` only on the client, never during server render.

## Commands (the user runs these)
- `npm install` · `npm run dev` · `npm test` · `npm run build`
