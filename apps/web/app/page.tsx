import { listPatterns } from "@architecture-lab/content";
import Link from "next/link";

export default function HomePage() {
  const available = listPatterns().filter((pattern) => pattern.status === "available");
  const nextPatterns = listPatterns()
    .filter((pattern) => pattern.status === "planned")
    .slice(0, 3);

  return (
    <div className="shell">
      <section className="hero">
        <div>
          <p className="kicker">Arquitetura de software</p>
          <h1>Veja o padrão acontecer.</h1>
          <p className="lede">
            O Architecture Lab percorre um fluxo real, pausa em cada evento e mostra o que uma falha
            deixa para trás. Os dois primeiros módulos completos são o Transactional Outbox e o
            Transactional Inbox.
          </p>
          <div className="actions">
            <Link className="button" href="/patterns/transactional-outbox">
              Abrir o Outbox
            </Link>
            <Link className="button secondary" href="/patterns/transactional-inbox">
              Abrir o Inbox
            </Link>
          </div>
        </div>
        <aside className="hero-card">
          <p className="kicker">O par</p>
          <ol>
            <li>O Outbox grava a mudança e a intenção de publicar juntas.</li>
            <li>A Inbox grava o efeito e o identificador da mensagem juntos.</li>
            <li>O ack do broker fica fora dessas transações.</li>
            <li>Nenhum dos dois entrega exatamente uma vez sozinho.</li>
          </ol>
        </aside>
      </section>

      <section className="section">
        <h2>Como ler o laboratório</h2>
        <div className="grid-4">
          <article className="panel">
            <p className="bench-label">
              <span>1</span> Cenário
            </p>
            <h3>Desenho e falha</h3>
            <p>Com o padrão ou sem ele. Uma falha troca o roteiro inteiro e recomeça do início.</p>
          </article>
          <article className="panel">
            <p className="bench-label">
              <span>2</span> Percurso
            </p>
            <h3>A ordem dos eventos</h3>
            <p>A trilha mostra cada etapa. O relógio só muda a velocidade, não o resultado.</p>
          </article>
          <article className="panel">
            <p className="bench-label">
              <span>3</span> Agora
            </p>
            <h3>O que esta etapa faz</h3>
            <p>O texto ao lado do diagrama explica o evento que está na tela.</p>
          </article>
          <article className="panel">
            <p className="bench-label">
              <span>4</span> Registros
            </p>
            <h3>O que ficou gravado</h3>
            <p>As tabelas provam o efeito: pedido, mensagem, cobrança ou ack.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>Módulos</h2>
        <div className="catalog-grid">
          {available.map((pattern) => (
            <Link key={pattern.slug} className="pattern-card" href={`/patterns/${pattern.slug}`}>
              <div className="meta-row">
                <span className="chip available">Disponível</span>
                <span className="chip">{pattern.category}</span>
                <span className="chip">{pattern.complexity}</span>
              </div>
              <h3>{pattern.title}</h3>
              <p>{pattern.summary}</p>
            </Link>
          ))}
          {nextPatterns.map((pattern) => (
            <article key={pattern.slug} className="pattern-card planned">
              <div className="meta-row">
                <span className="chip planned">Em seguida</span>
                <span className="chip">{pattern.category}</span>
              </div>
              <h3>{pattern.title}</h3>
              <p>{pattern.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
