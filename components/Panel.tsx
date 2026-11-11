"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { ISODate } from "@/lib/dates";
import { editProject, moveProject, setDays, setStageStatus } from "@/lib/edit";
import { STAGES, STATUS } from "@/lib/stages";
import { update } from "@/lib/store";
import type { Project, StageKey, Status } from "@/lib/types";
import s from "./Panel.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

interface PanelProps {
  project: Project;
  /** Row index (priority) and number of rows. */
  index: number;
  count: number;
  today: ISODate;
  /** Highlighted stage row. */
  stage: StageKey | null;
  /** Just created: focus and select the name. */
  fresh: boolean;
  onStage: (k: StageKey) => void;
  onClose: () => void;
}

/** Setup/edit panel. Doesn't dim the timeline; every change saves and re-renders live. */
export function Panel({ project: p, index, count, today, stage, fresh, onStage, onClose }: PanelProps) {
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fresh) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [fresh]);

  const edit = (fn: (p: Project) => Project) => update((st) => editProject(st, p.id, fn));

  return (
    <>
      <div className={s.scrim} onClick={onClose} />
      <aside className={s.drawer} role="dialog" aria-label="Project plan">
        <div className={s.dhd}>
          <input
            ref={nameRef}
            className={s.title}
            aria-label="Project name"
            value={p.name}
            onChange={(e) => edit((q) => ({ ...q, name: e.target.value }))}
            onBlur={(e) => edit((q) => ({ ...q, name: e.target.value.trim() || "Untitled project" }))}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
          <button className={s.xbtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={s.dbody}>
          <div className={s.fields}>
            <div>
              <label htmlFor="deadline">Deadline</label>
              <input
                id="deadline"
                type="date"
                value={p.deadline}
                onChange={(e) => e.target.value && edit((q) => ({ ...q, deadline: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={index}
                onChange={(e) => update((st) => moveProject(st, p.id, Number(e.target.value)))}
              >
                {Array.from({ length: count }, (_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={s.shead}>
            <span />
            <span>Stage</span>
            <span>Days</span>
            <span>Status</span>
          </div>
          {STAGES.map((def) => {
            const st = p.stages[def.key];
            return (
              <div key={def.key} className={cx(s.srowd, stage === def.key && s.hl)}>
                <i className={s.dot} style={{ "--c": def.color } as CSSProperties} />
                <div className={s.nm}>{def.name}</div>
                <input
                  type="number"
                  min={0}
                  max={60}
                  aria-label={`${def.name} days`}
                  defaultValue={st.est}
                  onChange={(e) => {
                    if (e.target.value === "") return;
                    edit((q) => setDays(q, def.key, Number(e.target.value)));
                    onStage(def.key);
                  }}
                  onBlur={(e) => {
                    // Show the saved (clamped) value, e.g. after clearing the field or typing 99.
                    e.target.value = String(p.stages[def.key].est);
                  }}
                />
                <select
                  aria-label={`${def.name} status`}
                  value={st.status}
                  onChange={(e) => {
                    edit((q) => setStageStatus(q, def.key, e.target.value as Status, today));
                    onStage(def.key);
                  }}
                >
                  {(Object.entries(STATUS) as [Status, string][]).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className={s.dft}>
          <button className="btn" onClick={onClose}>
            Done
          </button>
        </div>
      </aside>
    </>
  );
}
