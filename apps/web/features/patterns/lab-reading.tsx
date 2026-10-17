const STEPS = [
  {
    label: "Cenário",
    title: "Desenho e falha",
    text: "Com o padrão ou sem ele. A escolha mostra o problema e o que queremos melhorar. Uma falha troca o roteiro inteiro.",
  },
  {
    label: "Percurso",
    title: "A ordem dos eventos",
    text: "A trilha mostra cada etapa, inteira, na mesma tela. O relógio só muda a velocidade, não o resultado.",
  },
  {
    label: "Agora",
    title: "O que esta etapa faz",
    text: "O texto ao lado do diagrama explica o evento que está na tela.",
  },
  {
    label: "Registros",
    title: "O que ficou gravado",
    text: "As tabelas provam o efeito: pedido, mensagem, cobrança ou ack.",
  },
] as const;

export function LabReadingSteps() {
  return (
    <div className="grid-4">
      {STEPS.map((step, index) => (
        <article key={step.label} className="panel">
          <p className="bench-label">
            <span>{index + 1}</span> {step.label}
          </p>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
        </article>
      ))}
    </div>
  );
}
