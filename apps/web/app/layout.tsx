import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/site";
import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Outfit } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Architecture Lab",
    template: "%s · Architecture Lab",
  },
  description:
    "Plataforma para estudar padrões de arquitetura com simulações determinísticas, falhas e exemplos em .NET.",
  openGraph: {
    locale: "pt_BR",
    siteName: "Architecture Lab",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        <SiteHeader />
        <main id="conteudo">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
