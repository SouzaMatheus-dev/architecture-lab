export function Exercise({
  items,
}: {
  items: readonly { question: string; answer: string }[];
}) {
  return (
    <section className="exercise article-section" aria-labelledby="exercicios">
      <h2 id="exercicios">Exercícios</h2>
      <p className="exercise-lead">
        Responda com o que a simulação mostrou. Cada questão abre a própria resposta.
      </p>
      <ol className="exercise-list">
        {items.map((item, index) => (
          <li key={item.question}>
            <details className="exercise-item">
              <summary>
                <span className="exercise-index">{index + 1}</span>
                <span className="exercise-question">{item.question}</span>
                <span className="exercise-action">
                  <span className="exercise-action-closed">Ver resposta</span>
                  <span className="exercise-action-open">Ocultar</span>
                </span>
              </summary>
              <div className="answer">
                <p className="answer-label">Resposta</p>
                <p>{item.answer}</p>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
