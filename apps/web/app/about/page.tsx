import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Matheus Souza. Engenharia, arquitetura de sistemas distribuídos e liderança técnica por trás do Architecture Lab.",
};

const practices = [
  ["Backend e APIs", "ASP.NET Core, .NET, C# e APIs REST."],
  ["Arquitetura", "DDD, Clean Architecture, CQRS, hexagonal e modelo rico."],
  ["Mensageria", "Kafka, consumidores resilientes, retry, DLQ e idempotência."],
  ["Dados", "SQL Server, PostgreSQL, MySQL, MongoDB e DynamoDB."],
  ["Entrega", "Pipeline, especificação como contrato e teste no caminho crítico."],
  ["Nuvem", "Docker, Kubernetes, GitHub Actions, AWS, Azure e GCP."],
  ["Operação", "Logs estruturados, métricas, tracing e análise de falhas."],
  ["Liderança", "Priorização, delegação, feedback e decisão no time."],
] as const;

const tools = [
  [
    "McpSqlServer",
    ".NET 8",
    "SQL Server: mapeamento, auditoria e consulta somente leitura, com autenticação Windows.",
  ],
  [
    "McpKubernetes",
    ".NET 8",
    "Kubernetes somente leitura, via API nativa, Rancher ou Dashboard. Sem apply, delete ou exec.",
  ],
  [
    "McpNotebookLM",
    ".NET 8",
    "Cria notebooks e envia documentação ao NotebookLM com a sessão Google de quem usa.",
  ],
  [
    "McpGuardWatch",
    ".NET 10",
    "Logs, métricas, Kubernetes, APM, banco, SIEM e saúde do GuardWatch, somente leitura, com login LDAP.",
  ],
  [
    "McpApplicationInsights",
    ".NET 8",
    "Application Insights somente leitura. Assinatura e componente ficam no login de quem usa. O pacote não guarda segredo.",
  ],
  ["McpKafka", ".NET 8", "Kafka UI somente leitura: tópicos e mensagens. Sem produce nem delete."],
] as const;

export default function AboutPage() {
  return (
    <div className="shell about">
      <header className="page-intro">
        <p className="kicker">Autoria</p>
        <h1>Matheus Souza</h1>
        <p className="credentials">
          Engenharia da Computação · Pós em Liderança Técnica · MBA em Arquitetura
        </p>
        <p className="lede">
          Arquitetura de sistemas distribuídos, qualidade da entrega e liderança técnica. O
          Architecture Lab torna esses critérios visíveis: cada módulo mostra a falha, o que ficou
          gravado e o que o padrão não promete.
        </p>
        <div className="actions">
          <a className="button" href="https://mathneves.com/">
            mathneves.com
          </a>
          <a className="button secondary" href="https://github.com/SouzaMatheus-dev">
            GitHub
          </a>
          <a className="button secondary" href="mailto:souzamath63@gmail.com">
            souzamath63@gmail.com
          </a>
        </div>
      </header>

      <section className="stat-row" aria-label="Trajetória">
        <article>
          <strong>6+</strong>
          <span>anos em sistemas, entrega e times</span>
        </article>
        <article>
          <strong>6</strong>
          <span>pacotes abertos na comunidade</span>
        </article>
        <article>
          <strong>.NET</strong>
          <span>do modelo acoplado ao orientado a eventos</span>
        </article>
      </section>

      <section className="section">
        <h2>Onde a experiência se encontra</h2>
        <div className="grid-3">
          <article className="panel">
            <h3>Sistemas</h3>
            <p>
              Backend de média e alta complexidade. A trajetória no ecossistema .NET atravessa
              integrações, processamento assíncrono, consistência, resiliência e operação em
              produção.
            </p>
          </article>
          <article className="panel">
            <h3>Qualidade da entrega</h3>
            <p>
              Pipeline, especificação como contrato e teste no caminho crítico. O critério vem antes
              da ferramenta. Time sem critério de qualidade vira pressa.
            </p>
          </article>
          <article className="panel">
            <h3>Liderança técnica</h3>
            <p>
              Priorização, delegação, feedback e capacitação. Uma decisão boa equilibra negócio,
              arquitetura, operação e gente. O time decide sem a liderança virar o gargalo.
            </p>
          </article>
        </div>
      </section>

      <blockquote className="principle">
        <p>
          Bons sistemas não se definem pela ausência de falhas, e sim pela capacidade de lidar com
          elas de forma clara, controlada e previsível.
        </p>
      </blockquote>

      <section className="section">
        <h2>Prática</h2>
        <dl className="practice-grid">
          {practices.map(([title, detail]) => (
            <div key={title}>
              <dt>{title}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="section">
        <h2>Ferramentas abertas</h2>
        <p className="lede">
          Servidores MCP publicados no NuGet, em .NET 8 e .NET 10. Leitura onde o risco pede limite.
          A credencial fica no ambiente de quem usa.
        </p>
        <div className="grid-3 tool-grid">
          {tools.map(([title, runtime, detail]) => (
            <article key={title} className="panel">
              <p className="kicker">NuGet · {runtime}</p>
              <h3>{title}</h3>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Como o laboratório usa isso</h2>
        <div className="grid-3">
          <article className="panel">
            <h3>Conteúdo</h3>
            <p>
              O texto nomeia o problema, o custo e o que o padrão não garante. Outbox e Inbox não
              entregam exatamente uma vez.
            </p>
          </article>
          <article className="panel">
            <h3>Simulação</h3>
            <p>
              O motor percorre um roteiro determinístico. Avançar, voltar e trocar a falha não
              dependem de um broker real.
            </p>
          </article>
          <article className="panel">
            <h3>Interface</h3>
            <p>
              Cenário, percurso, etapa atual e registros leem o mesmo estado. O exemplo .NET
              acompanha esse comportamento.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
