import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell">
        <Link className="wordmark" href="/">
          <span className="mark" aria-hidden="true">
            AL
          </span>
          Architecture Lab
        </Link>
        <nav className="nav" aria-label="Principal">
          <Link href="/patterns">Catálogo</Link>
          <Link href="/patterns/transactional-outbox">Outbox</Link>
          <Link href="/about">Sobre</Link>
        </nav>
      </div>
    </header>
  );
}
