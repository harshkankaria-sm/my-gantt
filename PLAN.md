# Build Plan — My Gantt (Next.js → Vercel)

Each phase runs in a **new chat**. Start it by pasting the phase's **Kick-off prompt**. Claude writes the code. **You** run it, check the **You verify** list, and report fixes. Tick the phase off in the tracker when you're happy with it.

## Working agreement

- **Claude doesn't run Node, npm, tests, builds or the dev server** unless you ask in that chat. The standing exceptions: Phase 0 runs `create-next-app` and `npm install`, and every phase ends with a type check (`npx tsc --noEmit`), with any errors fixed.
- **You run** `npm install` / `npm run dev` (and `npm test` if you want) and tell Claude what to fix.
- **Commits and pushes happen only when you ask.**

## Sources of truth (read before every phase)

| File | What it is |
|---|---|
| `product_sense.md` | **What** to build and **why**. Every element must trace to a pain point (§3) and be listed in scope (§6) |
| `prototype.html` | **How** it should look and behave. A working reference for UI, UX and the planning logic (`planAll()`) |
| `PLAN.md` | This file: phases, scope per phase, progress |
| `CLAUDE.md` | Rules for every chat |

## Stack (decided)

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**
- **Vitest** test files for the planning engine. They're written, but run only if you choose to.
- **No backend.** State lives in the browser's `localStorage`, behind a small store module. Everything is a client component.
- **Hosted on Vercel** (Phase 6), deployed from a GitHub repo.

## Tracker

- [x] Phase 0 — Setup
- [x] Phase 1 — Data model + planning engine
- [x] Phase 2 — Timeline view (read-only)
- [x] Phase 3 — Project panel, new project, ✓ Done
- [x] Phase 4 — Sub-milestones
- [x] Phase 5 — Parity check + real data
- [ ] Phase 6 — Deploy to Vercel

---

## Phase 0 — Setup

**Goal:** an empty Next.js app you can run locally.

**Prerequisite (done):** Node.js v26.13.0 LTS is installed at `~/.local/node`. Your shell needs `export PATH="$HOME/.local/node/bin:$PATH"` in `~/.zshrc`.

**Claude does** (approved exception to the "no running Node" rule: Phase 0 runs `create-next-app` and `npm install`)
- Runs `npx create-next-app@latest` with TypeScript, Tailwind, ESLint, App Router, no `src/` dir and the `@/*` import alias.
  - It scaffolds into a temp folder, then moves the files into this folder, because create-next-app refuses a folder that already has files.
  - It keeps the existing `CLAUDE.md`, `PLAN.md`, `product_sense.md` and `prototype.html`. If the generator creates its own `CLAUDE.md`/`AGENTS.md`, ours wins.
- Adds Vitest as a dev dependency and a `test` script.
- Strips the boilerplate: starter page content, sample SVGs, and the light-mode CSS.
- Ports the prototype's design tokens (colours, fonts, radii) into CSS variables / Tailwind theme. Dark theme only.
- `app/page.tsx` renders the title "My Gantt" on the prototype's background.

**You verify**
- `npm run dev`: http://localhost:3000 shows "My Gantt" styled like the prototype.

**Kick-off prompt**
> Start Phase 0 of PLAN.md. Read CLAUDE.md, PLAN.md, product_sense.md and prototype.html first.

---

## Phase 1 — Data model + planning engine

**Goal:** all planning logic as pure TypeScript, with no UI.

**Claude does**
- `lib/dates.ts`: working-day helpers (prevWork, nextWork, spanEnd, diff, fmt), based on the prototype.
- `lib/types.ts`: `Project`, `StageState`, `SubMilestone`, `Plan`.
- `lib/stages.ts`: the 8 stages (key, name, short label, colour, default days, phase pre/post) and the 4 PRD steps.
- `lib/plan.ts`: port `planAll()` from the prototype.
  - Post-dev planned backward from the deadline.
  - `handoverBy` = the working day before dev starts.
  - Pre-dev planned forward from today; started or done stages anchored to `startedOn` / `doneOn`.
  - Each project planned on its own.
  - Plus `isLate`, `current`, `advance` (✓ Done) and `setStatus`.
  - `today` is passed in as a parameter, so the logic can be tested.
- `lib/store.ts`: load/save to `localStorage` (wrapped in try/catch). Starts with one sample project (due 4 weeks from today); you add your own.
- `lib/plan.test.ts` (written, not run). With today fixed at 11 Nov 2026 it covers:
  - weekends skipped
  - backward post-dev and handoverBy
  - forward pre-dev from today
  - done/doing anchoring
  - late rules
  - `advance`

**You verify (optional)**
- `npm test` passes. With the test fixture (product_sense §1 projects), Horoscope's PRD runs 11–12 Nov, handover is 18 Nov, and handoverBy is 17 Nov.

**Kick-off prompt**
> Start Phase 1 of PLAN.md. Read CLAUDE.md, PLAN.md, product_sense.md and prototype.html (especially `planAll()`).

---

## Phase 2 — Timeline view (read-only)

**Goal:** the main screen renders the plan exactly like the prototype, with no editing yet.

**Claude does**
- Header row:
  - month label on Mondays and the 1st
  - **weekday initial**, then day number
  - today highlighted; deadline dates in red
- Weekend shading and day grid.
- One row per project in priority (array) order:
  - sticky left column with the name
  - a bar of stage segments in the todo / doing / done / late styles
  - labels shown only when the segment is wide enough
  - a tooltip on each segment: "Stage · due D Mon"
- Today line (dashed), "Handover by" line (white dashed) and deadline line (red), per row.
- Stage legend, plus legend entries for the "Handover by" and deadline markers.
- On load, scroll to today.

**You verify**
- Side by side with `prototype.html`, the same projects look the same.
- There are no elements beyond those listed in product_sense §6.

**Kick-off prompt**
> Start Phase 2 of PLAN.md. Read CLAUDE.md, PLAN.md, product_sense.md and prototype.html. Phase 1's engine is in lib/.

---

## Phase 3 — Project panel, new project, ✓ Done

**Goal:** the main use case (P1): set up a new project in about 5 minutes, with the timeline updating live.

**Claude does**
- **"+ New project"** creates a project with all 8 stages at default days and the 4 PRD steps, and opens the panel with the name selected.
- Side panel, opened by clicking a project name or any segment:
  - editable name
  - **deadline** (the only date input)
  - **priority** (row order only)
  - per stage: days and status
  - the clicked stage highlighted
- The panel doesn't dim the timeline. Esc or Done closes it.
- **✓ Done** on the row marks the current stage done and starts the next. Pre-dev re-plans from today.
- Every change saves to `localStorage` and re-renders live.

**You verify**
- A brand-new project can be set up in under 5 minutes.
- Changing priority never moves another project's dates.
- The plan survives a page reload.

**Kick-off prompt**
> Start Phase 3 of PLAN.md. Read CLAUDE.md, PLAN.md, product_sense.md and prototype.html. Phases 1–2 are done.

---

## Phase 4 — Sub-milestones

**Goal:** P2 — progress inside a stage.

**Claude does**
- A ▶ arrow on the row expands the project.
- Two collapsible groups: **PRD finalise** and **Dev**. The current stage's group is open by default, and open/closed state is remembered per project.
- Item row: checkbox, name you can edit inline, **icon-only** date picker, and ×.
- "+ Add" inside each group.
- Diamonds:
  - on the project row when it's collapsed, and on a group's header row when that group is collapsed
  - at the item's date, or spread across the stage's segment when it has no date
  - grey when done, red when late
  - tooltip with the name

**You verify**
- The behaviour matches the prototype.
- Ticking, renaming, re-dating, adding and removing all survive a reload.

**Kick-off prompt**
> Start Phase 4 of PLAN.md. Read CLAUDE.md, PLAN.md, product_sense.md and prototype.html. Phases 1–3 are done.

---

## Phase 5 — Parity check + real data

**Goal:** ready for daily use.

**Claude does**
- Goes through every row of product_sense §6 against the code. Removes anything not listed and flags anything missing.
- Narrow screens: left column 220px under 700px wide, as in the prototype.
- Updates the default stage days you confirm (product_sense §9).

**You verify**
- Every §6 item works, and nothing outside §6 is in the app.
- A timed new-project setup takes ≤ 5 minutes.

**Kick-off prompt**
> Start Phase 5 of PLAN.md. Read CLAUDE.md, PLAN.md, product_sense.md and prototype.html. Phases 1–4 are done.

---

## Phase 6 — Deploy to Vercel

**Goal:** the app is live on a Vercel URL and redeploys automatically on every push.

**Know before you deploy**
- **Data lives in each browser's `localStorage`.**
  - The Vercel URL starts empty; projects you entered on `localhost` don't carry over.
  - Use one browser on the Vercel URL as your real copy.
  - Clearing site data erases your plans.
- **Anyone with the URL can open the app.** They only see their own empty copy; your data never leaves your browser.
- Vercel's free **Hobby** plan is enough for this app.

**Claude does**
- Checks the project is ready for Vercel:
  - no server-only APIs
  - `localStorage` used only on the client, never during server render (avoids hydration errors)
  - no environment variables needed
- Adds `"engines": {"node": ">=20"}` to `package.json`.
- Commits the code, but only when you ask.

**You do**
1. **GitHub:** create an empty **private** repo (e.g. `my-gantt`) on github.com.
2. **Push:** ask Claude to add the remote and push. Or run it yourself:
   `git remote add origin <repo-url>` → `git push -u origin main`
3. **Vercel:** go to vercel.com → sign in with GitHub → **Add New… → Project** → import `my-gantt`.
   - Framework preset: **Next.js** (auto-detected)
   - Build command, output directory and install command: leave as default
   - Environment variables: none
   - Click **Deploy**.
4. **Open** the `*.vercel.app` URL and check it matches localhost.
5. **From now on:** every push to `main` redeploys production automatically, and pushes to other branches get preview URLs.

**You verify**
- The Vercel URL loads with no console errors.
- You can create a project there, and it survives a reload.

**Kick-off prompt**
> Start Phase 6 of PLAN.md. Read CLAUDE.md and PLAN.md. Phases 0–5 are done.
