"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { todayStr } from "@/lib/dates";
import { addProject, editProject, newProject } from "@/lib/edit";
import { advance } from "@/lib/plan";
import { getServerSnapshot, getSnapshot, subscribe, update } from "@/lib/store";
import type { StageKey } from "@/lib/types";
import { Panel } from "./Panel";
import { Board, Legend } from "./Timeline";

interface Ui {
  /** Project whose panel is open. */
  open: string | null;
  /** Highlighted stage in the panel. */
  stage: StageKey | null;
  /** Just created: select the name. */
  fresh: boolean;
}

const CLOSED: Ui = { open: null, stage: null, fresh: false };

export function Planner() {
  // null during server render; localStorage is read only in the browser.
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [ui, setUi] = useState<Ui>(CLOSED);

  // Esc closes the panel.
  useEffect(() => {
    if (!ui.open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUi(CLOSED);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ui.open]);

  const create = () => {
    const p = newProject(todayStr());
    update((s) => addProject(s, p));
    setUi({ open: p.id, stage: null, fresh: true });
  };

  const index = state && ui.open ? state.projects.findIndex((p) => p.id === ui.open) : -1;
  const project = index >= 0 ? state!.projects[index] : null;
  const today = todayStr();

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="m-0 text-2xl font-bold tracking-[-0.01em]">My Gantt</h1>
        <button className="btn primary" onClick={create}>
          + New project
        </button>
      </div>
      <Legend />
      <Board
        state={state}
        onEdit={(id, stage) => setUi({ open: id, stage, fresh: false })}
        onAdvance={(id) => update((s) => editProject(s, id, (p) => advance(p, todayStr())))}
      />
      {project && (
        <Panel
          key={project.id}
          project={project}
          index={index}
          count={state!.projects.length}
          today={today}
          stage={ui.stage}
          fresh={ui.fresh}
          onStage={(k) => setUi((u) => ({ ...u, stage: k }))}
          onClose={() => setUi(CLOSED)}
        />
      )}
    </>
  );
}
