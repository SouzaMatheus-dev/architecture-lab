import { PatternCard } from "@/components/pattern-card";
import { listPatterns } from "@architecture-lab/content";
import type { Metadata } from "next";

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
      <section className="section" aria-label="Módulos">
        <div className="catalog-grid">
          {patterns.map((pattern) => (
            <PatternCard key={pattern.slug} pattern={pattern} heading="h2" />
          ))}
        </div>
      </section>
    </div>
  );
}
