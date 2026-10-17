import { siteUrl } from "@/lib/site";
import { listPatterns } from "@architecture-lab/content";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = siteUrl().origin;
  const now = new Date();

  return [
    { url: site, lastModified: now },
    { url: `${site}/patterns`, lastModified: now },
    { url: `${site}/about`, lastModified: now },
    ...listPatterns().map((pattern) => ({
      url: `${site}/patterns/${pattern.slug}`,
      lastModified: now,
    })),
  ];
}
