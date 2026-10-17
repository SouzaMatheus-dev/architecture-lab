import type { PatternSummary } from "@architecture-lab/content";
import Link from "next/link";

export function PatternCard({
  pattern,
  heading,
}: {
  pattern: PatternSummary;
  heading: "h2" | "h3";
}) {
  const Title = heading;

  return (
    <Link
      className={pattern.status === "available" ? "pattern-card" : "pattern-card planned"}
      href={`/patterns/${pattern.slug}`}
    >
      <div className="meta-row">
        <span className={pattern.status === "available" ? "chip available" : "chip planned"}>
          {pattern.status === "available" ? "Disponível" : "Planejado"}
        </span>
        <span className="chip">{pattern.category}</span>
        <span className="chip">{pattern.complexity}</span>
      </div>
      <Title>{pattern.title}</Title>
      <p>{pattern.summary}</p>
    </Link>
  );
}
