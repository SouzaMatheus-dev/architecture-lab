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
            deixa para trás. O primeiro módulo completo é o Transactional Outbox.
          </p>
          <div className="actions">
            <Link className="button" href="/patterns/transactional-outbox">
              Abrir o laboratório
            </Link>
            <Link className="button secondary" href="/patterns">
              Ver o catálogo
            </Link>
          </div>
        </div>
        <aside className="hero-card">
          <p className="kicker">No Outbox</p>
          <ol>
            <li>O pedido e a mensagem são gravados na mesma transação.</li>
            <li>A API responde antes de o Kafka confirmar.</li>
            <li>Se o broker falha, a pendência continua no banco.</li>
            <li>Uma republicação exige consumidor idempotente.</li>
          </ol>
        </aside>
      </section>

      <section className="section">
        <h2>O que a simulação torna visível</h2>
        <div className="grid-3">
          <article className="panel">
            <h3>O problema</h3>
            <p>O caminho sem o padrão mostra a inconsistência que a solução existe para evitar.</p>
          </article>
          <article className="panel">
            <h3>O fluxo</h3>
            <p>
              Cada etapa atualiza diagrama, tabelas e histórico. O resultado é o mesmo a cada
              execução.
            </p>
          </article>
          <article className="panel">
            <h3>A falha</h3>
            <p>
              Kafka, banco, worker e publicação duplicada entram como roteiros prontos, com causa e
              recuperação.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>Módulos</h2>
        <div className="catalog-grid">
          {available.map((pattern) => (
            <Link key={pattern.slug} className="pattern-card" href={`/patterns/${pattern.slug}`}>
              <div className="meta-row">
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
