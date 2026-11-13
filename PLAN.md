# Plan — My Gantt

How changes get made. What to build and why is in `product_sense.md`; past decisions are in `history/`.

## Sources of truth

| File | What it is |
|---|---|
| `product_sense.md` | **What** to build and **why**. Every element traces to a pain point (§3) and is listed in scope (§6) |
| `lib/` | **How** planning works: `plan.ts` (stages), `subs.ts` (steps), with Vitest tests |
| `components/` | **How** it looks and behaves |
| `CLAUDE.md` | Rules for every chat |
| `history/` | Decision log, the original build plan and the original prototype. Reference only |

## Stack

- **Next.js** (App Router) + **TypeScript** + **Tailwind CSS**.
- **Vitest** tests for the logic in `lib/`. They're written with every change and run only when you ask.
- **No backend.** State lives in the browser's `localStorage`, behind `lib/store.ts`. Everything is a client component; `localStorage` and today's date are read only in the browser.
- Node lives at `~/.local/node/bin`.

## Making a change

1. **Pain point:** add or update it in product_sense §3.
2. **Ideate:** list options and pick the smallest. New inputs or rules need an explicit yes.
3. **Scope:** add it to product_sense §6 with the pain point it serves, and update §5 if the planning rules change.
4. **Build:** Claude writes the code and tests, then runs `npx tsc --noEmit` and fixes any errors.
5. **Check:** you run `npm run dev` (and `npm test` if you want) and report fixes.
6. **Log:** add a dated entry to `history/decisions.md`.
7. **Ship:** commit, push and deploy only when you ask.

## Deploy

- Live at https://my-gantt-five.vercel.app (Vercel project `my-gantt`, Hobby plan).
- Deployed from this folder with the Vercel CLI: `vercel deploy --prod --yes`. Pushing to GitHub doesn't deploy.
- GitHub: `harshkankaria-sm/my-gantt` (private), branch `main`.
- Data lives in each browser's `localStorage`: the live URL and `localhost` have separate data, and clearing site data erases your plans. Anyone with the URL only sees their own empty copy.
