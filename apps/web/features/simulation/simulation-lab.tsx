"use client";

import type { LabMode } from "@architecture-lab/content";
import { SPEED_PRESETS, resolveFrames } from "@architecture-lab/simulation-engine";
import dynamic from "next/dynamic";
import { useState } from "react";
import { PLAYBACK_STEP_MS, useSimulation } from "./use-simulation";

const ArchitectureDiagram = dynamic(
  () => import("./architecture-diagram").then((module) => module.ArchitectureDiagram),
  {
    ssr: false,
    loading: () => <div className="diagram-canvas" aria-hidden="true" />,
  },
);

function formatSpeed(speed: number): string {
  return `${speed.toLocaleString("pt-BR")}×`;
}

function formatStepDuration(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  return `${seconds.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
}

const STATUS_LABEL: Record<string, string> = {
  inactive: "em espera",
  processing: "processando",
  success: "concluído",
  failure: "falha",
  waiting: "aguardando",
};

export function SimulationLab({ modes }: { modes: LabMode[] }) {
  const [modeId, setModeId] = useState(modes[0]?.id ?? "");
  const mode = modes.find((item) => item.id === modeId) ?? modes[0];
  if (!mode) {
    return null;
  }

  return (
    <ModeLab
      key={mode.id}
      mode={mode}
      modes={modes}
      onModeChange={(nextModeId) => setModeId(nextModeId)}
    />
  );
}

function ModeLab({
  mode,
  modes,
  onModeChange,
}: {
  mode: LabMode;
  modes: LabMode[];
  onModeChange: (modeId: string) => void;
}) {
  const { snapshot, dispatch } = useSimulation(mode.definition);
  const definition = mode.definition;
  const script = resolveFrames(definition, snapshot.activeFailureId);
  const stepNumber = snapshot.stepIndex + 1;
  const running = snapshot.status === "running";
  const finished = snapshot.status === "completed";

  return (
    <section className="lab" aria-label="Simulação do padrão">
      <div className="lab-toolbar">
        <p className="bench-label">
          <span>1</span> Cenário
        </p>
        <div className="choice-row" role="radiogroup" aria-label="Arquitetura">
          <p>Arquitetura</p>
          {modes.map((item) => (
            <label key={item.id} className="choice">
              <input
                type="radio"
                name="architecture-mode"
                checked={item.id === mode.id}
                onChange={() => onModeChange(item.id)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        <div className="choice-row" role="radiogroup" aria-label="Simular falha">
          <p>Falha</p>
          <label className="choice">
            <input
              type="radio"
              name={`failure-${mode.id}`}
              checked={snapshot.activeFailureId === null}
              onChange={() => dispatch({ type: "selectFailure", failureId: null })}
            />
            <span>Fluxo normal</span>
          </label>
          {definition.failures.map((failure) => (
            <label key={failure.id} className="choice">
              <input
                type="radio"
                name={`failure-${mode.id}`}
                checked={snapshot.activeFailureId === failure.id}
                onChange={() => dispatch({ type: "selectFailure", failureId: failure.id })}
              />
              <span>{failure.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="lab-stage">
        <div className="stage-head">
          <p className="bench-label">
            <span>2</span> Percurso
          </p>
          <div className="progress-label">
            <span>
              {snapshot.stepIndex < 0
                ? "Pronta para iniciar"
                : `Etapa ${stepNumber} de ${snapshot.stepCount}`}
            </span>
            <span>{Math.round(snapshot.progress * 100)}%</span>
          </div>
          <progress value={Math.max(snapshot.stepIndex + 1, 0)} max={snapshot.stepCount} />
        </div>

        <section className="timeline" aria-label="Linha do tempo">
          <h2 className="sr-only">Eventos</h2>
          <ol className="step-rail">
            <li>
              <button
                type="button"
                className="timeline-item"
                aria-current={snapshot.stepIndex < 0 ? "step" : undefined}
                onClick={() => dispatch({ type: "goTo", stepIndex: -1 })}
              >
                <strong>Início</strong>
                <small>{definition.initial.title}</small>
              </button>
            </li>
            {script.map((frame, index) => (
              <li key={frame.id}>
                <button
                  type="button"
                  className="timeline-item"
                  aria-current={index === snapshot.stepIndex ? "step" : undefined}
                  onClick={() => dispatch({ type: "goTo", stepIndex: index })}
                >
                  <strong>{frame.title}</strong>
                  <small>{frame.event.description}</small>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <div className="transport">
          <fieldset className="controls">
            <legend className="sr-only">Controles da simulação</legend>
            <button
              type="button"
              className="button primary"
              onClick={() => dispatch({ type: "play" })}
              disabled={running || finished}
            >
              Iniciar
            </button>
            <button
              type="button"
              className="button"
              onClick={() => dispatch({ type: "pause" })}
              disabled={!running}
            >
              Pausar
            </button>
            <button
              type="button"
              className="button"
              onClick={() => dispatch({ type: "stepBack" })}
              disabled={snapshot.stepIndex < 0}
            >
              Anterior
            </button>
            <button
              type="button"
              className="button"
              onClick={() => dispatch({ type: "stepForward" })}
              disabled={finished}
            >
              Próxima etapa
            </button>
            <button type="button" className="button" onClick={() => dispatch({ type: "reset" })}>
              Reiniciar
            </button>
          </fieldset>
          <fieldset className="choice-row speed-row" aria-describedby="speed-cadence">
            <legend>Velocidade</legend>
            {SPEED_PRESETS.map((speed) => (
              <label key={speed} className="choice">
                <input
                  type="radio"
                  name={`speed-${mode.id}`}
                  checked={snapshot.speed === speed}
                  onChange={() => dispatch({ type: "setSpeed", speed })}
                />
                <span>{formatSpeed(speed)}</span>
              </label>
            ))}
          </fieldset>
          <p id="speed-cadence" className="key-hint">
            Cada etapa automática leva {formatStepDuration(PLAYBACK_STEP_MS / snapshot.speed)}.
            Espaço inicia ou pausa. As setas mudam a etapa.
          </p>
        </div>

        <div className="workbench">
          <div className="canvas-card">
            <ArchitectureDiagram definition={definition} frame={snapshot.frame} />
            <div className="component-list">
              <ul aria-label="Estado dos componentes">
                {snapshot.frame.components.map((component) => {
                  const node = definition.nodes.find((item) => item.id === component.id);
                  const label = STATUS_LABEL[component.status] ?? component.status;
                  return (
                    <li key={component.id}>
                      <span className={`status-pill ${component.status}`}>
                        {node?.label ?? component.id}: {label}
                        {component.detail ? ` · ${component.detail}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <aside className="story">
            <p className="bench-label">
              <span>3</span> Agora
            </p>
            <p className="kicker">{finished ? "Concluída" : definition.title}</p>
            <h2>{snapshot.frame.title}</h2>
            <p className="narrative" aria-live="polite">
              {snapshot.frame.narrative}
            </p>
            {snapshot.frame.notes.length > 0 ? (
              <ul className="notes">
                {snapshot.frame.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
            <div className="lesson">
              <strong>O que este cenário mostra</strong>
              {snapshot.lesson}
            </div>
          </aside>
        </div>

        <section className="tables" aria-label="Tabelas do cenário">
          <p className="bench-label">
            <span>4</span> Registros
          </p>
          <div className="table-grid">
            {definition.tables.map((table) => {
              const rows = snapshot.frame.tables[table.id] ?? [];
              return (
                <article key={table.id}>
                  <h3>{table.title}</h3>
                  <table>
                    <thead>
                      <tr>
                        {table.columns.map((column) => (
                          <th key={column} scope="col">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td className="empty-row" colSpan={table.columns.length}>
                            Nenhuma linha
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr key={row.id}>
                            {table.columns.map((column) => (
                              <td key={column}>{row.cells[column]}</td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </article>
              );
            })}
          </div>
        </section>

        <p className="limit-note">
          <strong>Limite do padrão</strong>
          {mode.limitNote}
        </p>
      </div>
    </section>
  );
}
