"use client";

import { useState } from "react";

export function CodeSample({ filename, source }: { filename: string; source: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <figure className="code-sample">
      <header>
        <figcaption>{filename}</figcaption>
        <button type="button" className="button" onClick={() => void copy()}>
          {copied ? "Copiado" : "Copiar"}
        </button>
      </header>
      <pre>
        <code>{source}</code>
      </pre>
    </figure>
  );
}
