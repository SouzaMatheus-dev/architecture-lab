import { listPatterns } from "@architecture-lab/content";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Padrões de arquitetura disponíveis e planejados no Architecture Lab.",
};

export default function CatalogPage() {
  const patterns = listPatterns();

  return (
    <div className="shell">
      <header className="page-intro">
        <p className="kicker">Catálogo</p>
        <h1>Padrões com um modelo só.</h1>
        <p className="lede">
          Cada módulo separa o problema, o fluxo, a falha e o exemplo. Outbox e Inbox já podem ser
          percorridos. Os demais entram como nova definição, no mesmo motor.
        </p>
      </header>
      <section className="section">
        <div className="catalog-grid">
          {patterns.map((pattern) =>
            pattern.status === "available" ? (
              <Link key={pattern.slug} className="pattern-card" href={`/patterns/${pattern.slug}`}>
                <PatternBody pattern={pattern} />
              </Link>
            ) : (
              <article key={pattern.slug} className="pattern-card planned">
                <PatternBody pattern={pattern} />
              </article>
            ),
          )}
        </div>
      </section>
    </div>
  );
}

function PatternBody({
  pattern,
}: {
  pattern: ReturnType<typeof listPatterns>[number];
}) {
  return (
    <>
      <div className="meta-row">
        <span className="chip">{pattern.category}</span>
        <span className="chip">{pattern.complexity}</span>
        <span className={pattern.status === "available" ? "chip available" : "chip planned"}>
          {pattern.status === "available" ? "Disponível" : "Planejado"}
        </span>
      </div>
      <h3>{pattern.title}</h3>
      <p>{pattern.summary}</p>
    </>
  );
}
