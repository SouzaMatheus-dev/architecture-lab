import { PatternArticle } from "@/features/patterns/pattern-article";
import { SimulationBriefing } from "@/features/patterns/simulation-briefing";
import { SimulationLab } from "@/features/simulation/simulation-lab";
import { getPatternPage, listPatterns } from "@architecture-lab/content";
import type { PatternSummary, PlannedBrief } from "@architecture-lab/content";
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
    return <PlannedPattern summary={page.summary} brief={page.brief} />;
  }

  const { pattern } = page;

  return (
    <div className="shell pattern-page">
      <header className="page-intro">
        <p className="kicker">
          {pattern.summary.category} · {pattern.summary.complexity}
        </p>
        <h1>{pattern.summary.title}</h1>
        <p className="lede">{pattern.summary.summary}</p>
      </header>
      <SimulationBriefing flow={pattern.article.flow} />
      <SimulationLab modes={pattern.modes} contrast={pattern.contrast} />
      <PatternArticle pattern={pattern} />
    </div>
  );
}

const plannedReading = {
  id: "como-ler",
  title: "Como ler a simulação",
  paragraphs: [
    "A bancada deste módulo vai seguir os mesmos quatro passos. O relógio da tela só regula a velocidade. A sequência nasce do roteiro, não de um serviço real.",
  ],
};

function PlannedPattern({
  summary,
  brief,
}: {
  summary: PatternSummary;
  brief?: PlannedBrief;
}) {
  return (
    <div className="shell pattern-page">
      <header className="page-intro">
        <p className="kicker">
          {summary.category} · {summary.complexity}
        </p>
        <h1>{summary.title}</h1>
        <p className="lede">{summary.summary}</p>
      </header>
      <SimulationBriefing flow={plannedReading} />
      <p className="lede">Este módulo ainda não tem simulação.</p>
      {brief ? (
        <section className="lab-toolbar" aria-label="Proposta do módulo">
          <div className="contrast">
            <article>
              <p className="contrast-label">Problema</p>
              <p>{brief.problem}</p>
            </article>
            <article>
              <p className="contrast-label">O que queremos melhorar</p>
              <p>{brief.aim}</p>
            </article>
          </div>
          <p className="lede">{brief.limit}</p>
        </section>
      ) : null}
    </div>
  );
}
