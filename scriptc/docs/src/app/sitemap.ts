import type { MetadataRoute } from "next";
import { allDocsPages } from "@/lib/docs-navigation";
import { siteUrl } from "@/lib/site";
import { statSync } from "node:fs";
import path from "node:path";

export default function sitemap(): MetadataRoute.Sitemap {
  // The homepage lives in the site header, not the docs nav, so list it explicitly.
  const hrefs = ["/", ...allDocsPages.map((page) => page.href)];
  return hrefs.map((href) => ({
    url: `${siteUrl}${href}`,
    lastModified: lastModifiedFor(href),
  }));
}

function lastModifiedFor(href: string): Date {
  const relative = href === "/" ? "page.tsx" : path.join(href.slice(1), "page.mdx");
  try {
    return statSync(path.join(process.cwd(), "src", "app", relative)).mtime;
  } catch {
    return new Date("2026-07-22T00:00:00.000Z");
  }
}
