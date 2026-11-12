"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import { fmt, type ISODate } from "@/lib/dates";
import { addSub, editProject, editSub, newSub, removeSub, setGroupOpen } from "@/lib/edit";
import { STEP_DAYS, SUB_STAGES, stageDef } from "@/lib/stages";
import { update } from "@/lib/store";
import { groupItems, groupOpen, subSpot } from "@/lib/subs";
import type { Plan, Project, SubMilestone } from "@/lib/types";
import s from "./Timeline.module.css";

export const DAYW = 36;

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");
const color = (c: string) => ({ "--c": c }) as CSSProperties;

interface DiamondProps {
  p: Project;
  plan: Plan;
  sub: SubMilestone;
  lo: ISODate;
  today: ISODate;
}

/** A sub-milestone diamond: grey when done, red when late, tooltip with the name. */
export function Diamond({ p, plan, sub, lo, today }: DiamondProps) {
  const q = subSpot(p, plan, sub, lo, today);
  if (!q) return null;
  return (
    <i
      className={cx(s.dmd, sub.done && s.done, q.late && s.late)}
      style={{ left: q.x * DAYW - 5, ...color(q.color) }}
      title={`${sub.name} · ${fmt(q.end)}`}
    />
  );
}

interface SubRowsProps {
  p: Project;
  plan: Plan;
  lo: ISODate;
  today: ISODate;
  /** Track width in px. */
  width: number;
  /** "Handover by" and deadline lines, repeated on every row. */
  markers: ReactNode;
  /** Called with a new item's id so its name can be focused and selected. */
  onAdded: (id: string) => void;
}

/** The expanded checklist: one collapsible group per stage that carries sub-milestones. */
export function SubRows({ p, plan, lo, today, width, markers, onAdded }: SubRowsProps) {
  const edit = (fn: (p: Project) => Project) => update((st) => editProject(st, p.id, fn));
  const dmd = (sub: SubMilestone) => (
    <Diamond key={sub.id} p={p} plan={plan} sub={sub} lo={lo} today={today} />
  );

  return (
    <>
      {SUB_STAGES.map((k) => {
        const def = stageDef(k);
        const items = groupItems(p, k);
        const open = groupOpen(p, k);
        return (
          <Fragment key={k}>
            <div className={s.row}>
              <div className={cx(s.lcell, s.grp)} onClick={() => edit((q) => setGroupOpen(q, k, !open))}>
                <span className={cx(s.caret, open && s.open)}>▶</span>
                <i className={s.dot} style={color(def.color)} />
                {def.name}
              </div>
              <div className={cx(s.track, s.subtrack)} style={{ width }}>
                {markers}
                {!open && items.map(dmd)}
              </div>
            </div>

            {open &&
              items.map((sub) => (
                <div className={s.row} key={sub.id}>
                  <div className={cx(s.lcell, s.srow, s.in)}>
                    <input
                      type="checkbox"
                      checked={sub.done}
                      onChange={(e) => edit((q) => editSub(q, sub.id, (x) => ({ ...x, done: e.target.checked })))}
                    />
                    <input
                      className={cx(s.nm, sub.done && s.isdone)}
                      data-sub={sub.id}
                      aria-label="Sub-milestone name"
                      defaultValue={sub.name}
                      onBlur={(e) => {
                        const name = e.target.value.trim() || "Untitled";
                        e.target.value = name;
                        if (name !== sub.name) edit((q) => editSub(q, sub.id, (x) => ({ ...x, name })));
                      }}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    />
                    <select
                      className={s.days}
                      aria-label="Days"
                      value={sub.days}
                      onChange={(e) => {
                        const days = Number(e.target.value);
                        edit((q) => editSub(q, sub.id, (x) => ({ ...x, days })));
                      }}
                    >
                      {(STEP_DAYS.includes(sub.days) ? STEP_DAYS : [...STEP_DAYS, sub.days].sort((a, b) => a - b)).map(
                        (d) => (
                          <option key={d} value={d}>
                            {d}d
                          </option>
                        ),
                      )}
                    </select>
                    <button
                      className={s.xbtn}
                      onClick={() => edit((q) => removeSub(q, sub.id))}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>
                  <div className={cx(s.track, s.subtrack)} style={{ width }}>
                    {markers}
                    {dmd(sub)}
                  </div>
                </div>
              ))}

            {open && (
              <div className={s.row}>
                <div className={cx(s.lcell, s.srow, s.in)}>
                  <button
                    className={s.addsub}
                    onClick={() => {
                      const sub = newSub(k);
                      edit((q) => addSub(q, sub));
                      onAdded(sub.id);
                    }}
                  >
                    + Add
                  </button>
                </div>
                <div className={cx(s.track, s.subtrack)} style={{ width }}>
                  {markers}
                </div>
              </div>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
