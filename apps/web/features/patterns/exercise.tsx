"use client";

import { useState } from "react";

export function Exercise({
  items,
}: {
  items: readonly { question: string; answer: string }[];
}) {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());

  return (
    <section className="exercise article-section" aria-label="Exercícios">
      <h2>Exercícios</h2>
      <p>Responda com o que a simulação mostrou. Abra uma resposta de cada vez.</p>
      <ol className="exercise-list">
        {items.map((item, index) => {
          const shown = open.has(index);
          const number = index + 1;
          const answerId = `exercise-answer-${number}`;
          return (
            <li key={item.question}>
              <p>{item.question}</p>
              {shown ? (
                <p className="answer" id={answerId}>
                  {item.answer}
                </p>
              ) : null}
              <button
                type="button"
                className="button secondary"
                aria-expanded={shown}
                aria-controls={shown ? answerId : undefined}
                onClick={() => {
                  setOpen((current) => {
                    const next = new Set(current);
                    if (next.has(index)) {
                      next.delete(index);
                    } else {
                      next.add(index);
                    }
                    return next;
                  });
                }}
              >
                {shown ? `Ocultar resposta ${number}` : `Mostrar resposta ${number}`}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
