import { PatternArticle } from "@/features/patterns/pattern-article";
import { SimulationLab } from "@/features/simulation/simulation-lab";
import { getPatternPage, listPatterns } from "@architecture-lab/content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return listPatterns().map((pattern) => ({ slug: pattern.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getPatternPage(slug);
  if (!page) {
    return { title: "Padrão" };
  }
  const summary = page.status === "available" ? page.pattern.summary : page.summary;
  return {
    title: summary.title,
    description: summary.summary,
    alternates: { canonical: `/patterns/${summary.slug}` },
    openGraph: {
      title: summary.title,
      description: summary.summary,
      locale: "pt_BR",
      url: `/patterns/${summary.slug}`,
    },
  };
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPatternPage(slug);
  if (!page) {
    notFound();
  }

  if (page.status === "planned") {
    return (
      <div className="shell">
        <header className="page-intro">
          <p className="kicker">{page.summary.category}</p>
          <h1>{page.summary.title}</h1>
          <p className="lede">{page.summary.summary}</p>
          <p className="lede">
            Este módulo ainda não tem simulação. Outbox e Inbox mostram o contrato do motor; o
            próximo padrão entra como nova definição e novo conteúdo.
          </p>
        </header>
      </div>
    );
  }

  const { pattern } = page;

  return (
    <div className="shell">
      <header className="page-intro">
        <p className="kicker">
          {pattern.summary.category} · {pattern.summary.complexity}
        </p>
        <h1>{pattern.summary.title}</h1>
        <p className="lede">{pattern.summary.summary}</p>
      </header>
      <SimulationLab modes={pattern.modes} />
      <PatternArticle pattern={pattern} />
    </div>
  );
}
