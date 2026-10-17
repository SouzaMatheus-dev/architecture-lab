import { PatternCard } from "@/components/pattern-card";
import { LabReadingSteps } from "@/features/patterns/lab-reading";
import { listPatterns } from "@architecture-lab/content";
import Link from "next/link";

export default function HomePage() {
  const patterns = listPatterns();

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
        <LabReadingSteps />
      </section>

      <section className="section">
        <h2>Módulos</h2>
        <div className="catalog-grid">
          {patterns.map((pattern) => (
            <PatternCard key={pattern.slug} pattern={pattern} heading="h3" />
          ))}
        </div>
      </section>
    </div>
  );
}
