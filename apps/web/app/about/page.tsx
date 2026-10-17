import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Como o Architecture Lab separa conteúdo, simulação e interface.",
};

export default function AboutPage() {
  return (
    <div className="shell">
      <header className="page-intro">
        <p className="kicker">Sobre</p>
        <h1>Um laboratório, não um cluster.</h1>
        <p className="lede">
          As simulações rodam no navegador. Elas explicam causa, efeito e recuperação sem exigir
          Kafka, banco ou autenticação.
        </p>
      </header>
      <section className="section grid-3">
        <article className="panel">
          <h2>Conteúdo</h2>
          <p>
            O texto diz qual problema o padrão resolve, quando ele vale o custo e o que ele não
            garante.
          </p>
        </article>
        <article className="panel">
          <h2>Simulação</h2>
          <p>
            O motor aplica um roteiro determinístico. Avançar, voltar e reiniciar não dependem do
            relógio.
          </p>
        </article>
        <article className="panel">
          <h2>Interface</h2>
          <p>
            O diagrama, as tabelas e a linha do tempo são leituras do mesmo estado. O exemplo .NET
            acompanha esse comportamento.
          </p>
        </article>
      </section>
      <section className="section author-panel">
        <p className="kicker">Autoria</p>
        <h2>Matheus Souza</h2>
        <p>
          O laboratório fica sob a tutela de Matheus Souza. O site reúne engenharia, arquitetura de
          sistemas e liderança técnica.
        </p>
        <a className="button secondary" href="https://mathneves.com/">
          mathneves.com
        </a>
      </section>
    </div>
  );
}
