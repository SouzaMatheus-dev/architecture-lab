"use client";

import { useState } from "react";

export function Exercise({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="exercise article-section" aria-label="Exercício">
      <h2>Exercício</h2>
      <p>{question}</p>
      {open ? <p className="answer">{answer}</p> : null}
      <button type="button" className="button" onClick={() => setOpen((current) => !current)}>
        {open ? "Ocultar resposta" : "Mostrar resposta"}
      </button>
    </section>
  );
}
