export const PAGE_TITLES: Record<string, string> = {
  "": "TypeScript-to-Native\nCompiler",
  introduction: "Introduction",
  quickstart: "Quickstart",
  cli: "CLI Reference",
  coverage: "Coverage Reports",
  dependencies: "npm Dependencies",
  ffi: "Native FFI",
  platforms: "Platform Support",
  "how-it-works": "How It Works",
  limitations: "Limitations",
};

export function getPageTitle(slug: string): string | null {
  return slug in PAGE_TITLES ? PAGE_TITLES[slug]! : null;
}
