"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";
import { addDays, diff, fmt, parse, todayStr, type ISODate } from "@/lib/dates";
import { editProject, toggleExpanded } from "@/lib/edit";
import { current, isLate, planAll } from "@/lib/plan";
import { STAGES } from "@/lib/stages";
import { update } from "@/lib/store";
import type { AppState, StageKey } from "@/lib/types";
import { DAYW, Diamond, SubRows } from "./Subs";
import s from "./Timeline.module.css";

const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
const color = (c: string) => ({ "--c": c }) as CSSProperties;

export function Legend() {
  return (
    <div className={s.legend}>
      {STAGES.map((st) => (
        <span key={st.key}>
          <i className={s.dot} style={color(st.color)} />
          {st.name}
        </span>
      ))}
      <span>
        <i className={cx(s.mk, s.h)} />
        Handover by
      </span>
      <span>
        <i className={s.mk} />
        Deadline
      </span>
    </div>
  );
}

interface BoardProps {
  /** null during server render; localStorage is read only in the browser. */
  state: AppState | null;
  /** Open the panel for a project, highlighting the clicked stage. */
  onEdit: (id: string, stage: StageKey | null) => void;
  /** ✓ Done on the row. */
  onAdvance: (id: string) => void;
}

export function Board({ state, onEdit, onAdvance }: BoardProps) {
  const board = useRef<HTMLDivElement>(null);
  const today = state ? todayStr() : "";

  // Visible range: Monday a week before the earliest date → Sunday a week after the latest.
  let lo: ISODate = today;
  let hi: ISODate = today;
  const plans = state ? planAll(state.projects, today) : {};
  if (state) {
    for (const p of state.projects) {
      const plan = plans[p.id];
      for (const st of STAGES) {
        const r = plan[st.key];
        if (!r) continue;
        if (r.start < lo) lo = r.start;
        if (r.end > hi) hi = r.end;
      }
      if (p.deadline > hi) hi = p.deadline;
    }
    lo = addDays(lo, -7);
    while (parse(lo).getDay() !== 1) lo = addDays(lo, -1);
    hi = addDays(hi, 7);
    while (parse(hi).getDay() !== 0) hi = addDays(hi, 1);
  }
  const x = (d: ISODate) => diff(lo, d) * DAYW;
  const todayX = state ? x(today) : 0;

  // On load, scroll to today. Once only, so later edits keep the scroll position.
  const scrolled = useRef(false);
  useEffect(() => {
    if (!state || scrolled.current || !board.current) return;
    scrolled.current = true;
    board.current.scrollLeft = Math.max(0, todayX - 3 * DAYW);
  }, [state, todayX]);

  // After "+ Add", focus and select the new item's name.
  const focusSub = useRef<string | null>(null);
  useEffect(() => {
    if (!focusSub.current) return;
    const el = board.current?.querySelector<HTMLInputElement>(`[data-sub="${focusSub.current}"]`);
    focusSub.current = null;
    el?.focus();
    el?.select();
  });

  if (!state) return <div className={s.board} ref={board} />;

  const nDays = diff(lo, hi) + 1;
  const W = nDays * DAYW;
  const deadlines = new Set(state.projects.map((p) => p.deadline));

  const head = Array.from({ length: nDays }, (_, i) => {
    const d = addDays(lo, i);
    const dt = parse(d);
    const dow = dt.getDay();
    const month = i === 0 || dt.getDate() === 1 || dow === 1 ? MON[dt.getMonth()] : "";
    return (
      <div
        key={d}
        className={cx(
          s.dh,
          (dow === 0 || dow === 6) && s.wk,
          dow === 1 && s.mon,
          d === today && s.today,
          deadlines.has(d) && s.dl,
        )}
      >
        <span className={s.m}>{month}</span>
        <span className={s.w}>{"SMTWTFS"[dow]}</span>
        <b>{dt.getDate()}</b>
      </div>
    );
  });

  return (
    <div className={s.board} ref={board}>
      <div className={s.grid}>
        <div className={cx(s.row, s.hrow)}>
          <div className={s.lcell} />
          <div className={s.track} style={{ width: W }}>
            {head}
          </div>
        </div>

        {state.projects.map((p) => {
          const plan = plans[p.id];
          const cur = current(p);
          const markers = (
            <>
              <i className={s.hline} style={{ left: x(plan.handoverBy) + DAYW - 1 }} />
              <i className={s.dline} style={{ left: x(p.deadline) + DAYW - 1 }} />
            </>
          );
          return (
            <Fragment key={p.id}>
            <div className={s.row}>
              <div className={cx(s.lcell, s.prow)}>
                <button
                  className={cx(s.caret, p.expanded && s.open)}
                  onClick={() => update((st) => editProject(st, p.id, toggleExpanded))}
                  aria-label="Sub-milestones"
                >
                  ▶
                </button>
                <div className={s.pinfo}>
                  <div className={s.pname} onClick={() => onEdit(p.id, null)}>
                    {p.name}
                  </div>
                </div>
                {cur && (
                  <button className={s.donebtn} onClick={() => onAdvance(p.id)}>
                    ✓ Done
                  </button>
                )}
              </div>
              <div className={cx(s.track, s.bartrack)} style={{ width: W }}>
                {markers}
                {STAGES.map((st) => {
                  const r = plan[st.key];
                  if (!r) return null;
                  const ss = p.stages[st.key];
                  const late = isLate(st, ss, r, plan, today);
                  const w = (diff(r.start, r.end) + 1) * DAYW - 4;
                  return (
                    <div
                      key={st.key}
                      className={cx(s.seg, s[ss.status], late && s.late)}
                      style={{ left: x(r.start) + 2, width: w, ...color(st.color) }}
                      title={`${st.name} · due ${fmt(r.end)}`}
                      onClick={() => onEdit(p.id, st.key)}
                    >
                      {w >= 44 && (
                        <span>
                          {ss.status === "done" ? "✓ " : ""}
                          {st.short}
                        </span>
                      )}
                    </div>
                  );
                })}
                {!p.expanded &&
                  p.subs.map((sub) => (
                    <Diamond key={sub.id} p={p} plan={plan} sub={sub} lo={lo} today={today} />
                  ))}
              </div>
            </div>
            {p.expanded && (
              <SubRows
                p={p}
                plan={plan}
                lo={lo}
                today={today}
                width={W}
                markers={markers}
                onAdded={(id) => (focusSub.current = id)}
              />
            )}
            </Fragment>
          );
        })}

        <i className={s.todayline} style={{ left: `calc(var(--left) + ${todayX + DAYW / 2}px)` }} />
      </div>
    </div>
  );
}
