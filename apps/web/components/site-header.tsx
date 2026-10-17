import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell">
        <Link className="wordmark" href="/">
          <BrandMark />
          Architecture Lab
        </Link>
        <nav className="nav" aria-label="Principal">
          <Link href="/patterns">Catálogo</Link>
          <Link href="/about">Sobre</Link>
        </nav>
      </div>
    </header>
  );
}
