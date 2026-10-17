import type { PatternWriteup } from "@architecture-lab/content";
import { LabReadingSteps } from "./lab-reading";

export function SimulationBriefing({ flow }: { flow: PatternWriteup["flow"] }) {
  return (
    <section className="briefing" aria-labelledby={flow.id}>
      <h2 id={flow.id}>{flow.title}</h2>
      {flow.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <LabReadingSteps />
    </section>
  );
}
