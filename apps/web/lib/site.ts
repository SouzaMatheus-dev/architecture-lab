export function siteUrl(): URL {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
}
