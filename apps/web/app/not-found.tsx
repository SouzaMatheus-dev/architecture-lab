import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell page-intro">
      <p className="kicker">404</p>
      <h1>Esta página não está no laboratório.</h1>
      <p className="lede">O catálogo lista os padrões publicados e os que ainda vão entrar.</p>
      <div className="actions">
        <Link className="button" href="/patterns">
          Voltar ao catálogo
        </Link>
      </div>
    </div>
  );
}
