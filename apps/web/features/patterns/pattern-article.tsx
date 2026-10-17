import type { AvailablePattern } from "@architecture-lab/content";
import { CodeSample } from "./code-sample";
import { Exercise } from "./exercise";

export function PatternArticle({ pattern }: { pattern: AvailablePattern }) {
  const { article } = pattern;

  return (
    <div className="article">
      <section className="article-section" id={article.problem.id}>
        <h2>{article.problem.title}</h2>
        {article.problem.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="article-section" id={article.comparison.id}>
        <h2>{article.comparison.title}</h2>
        {article.comparison.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="article-section" id={article.flow.id}>
        <h2>{article.flow.title}</h2>
        {article.flow.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>

      <section className="article-section" id={article.tradeoffs.id}>
        <h2>{article.tradeoffs.title}</h2>
        <div className="split">
          <div>
            <h3>Benefícios</h3>
            <ul>
              {article.tradeoffs.pros.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Custos</h3>
            <ul>
              {article.tradeoffs.cons.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="article-section" id={article.whenToUse.id}>
        <h2>{article.whenToUse.title}</h2>
        {article.whenToUse.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="split">
          <div>
            <h3>Vale a pena</h3>
            <ul>
              {article.whenToUse.use.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Pode ficar de fora</h3>
            <ul>
              {article.whenToUse.avoid.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="article-section" id="exemplo-dotnet">
        <h2>Exemplo em .NET</h2>
        <p>{article.example.intro}</p>
        {article.example.files.map((file) => (
          <CodeSample key={file.filename} filename={file.filename} source={file.source} />
        ))}
      </section>

      <section className="article-section" id={article.accuracy.id}>
        <h2>{article.accuracy.title}</h2>
        <ul>
          {article.accuracy.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <Exercise question={article.exercise.question} answer={article.exercise.answer} />
    </div>
  );
}
