# Docs Site Conventions

This is the scriptc docs site: Next.js App Router + MDX, one topic per `src/app/<topic>/page.mdx`, standalone from the repo's pnpm workspace (it has its own lockfile; `pnpm install && pnpm check` runs entirely inside `docs/`).

## Naming

The project is **scriptc**, lowercase, everywhere — page titles, prose, code samples. All name-bearing strings (site name, tagline, GitHub URL, canonical origin `https://scriptc.dev`) live in `src/lib/site.ts`; copy elsewhere is written name-neutral and pulls from there.

## Content rules

- Coverage numbers on a page are only ever the output of `scriptc coverage` on a specific program shown in that same block — never aggregate statistics.
- Every shell command shown in a fence must have been run successfully against the current build before it lands on a page. Output blocks are real output (trimmed is fine, invented is not).
- Limitations are documented plainly on their own page, not scattered as fine print.

## MDX Tables

Always use HTML `<table>` syntax in MDX pages, never markdown pipe tables. This ensures consistent styling and avoids MDX parsing edge cases.

```html
<table>
  <thead>
    <tr>
      <th>Column</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>field</code></td>
      <td>What it does</td>
    </tr>
  </tbody>
</table>
```

## Code fences

The fence info string carries the language, and optionally a filename after a colon (` ```ts:src/main.ts `) — that is the only fence metadata that survives the MDX pipeline. `console` is the register for shell sessions ( `$ command` then output); `diff` fences get +/- coloring.

## Definition lists

Flag and subcommand references use HTML `<dl>/<dt>/<dd>` (styled via `article dl` rules in `globals.css`).

## Adding a page

1. `src/app/<topic>/page.mdx` for the content and `src/app/<topic>/layout.tsx` exporting `pageMetadata("<topic>")`.
2. Add the slug to `PAGE_TITLES` in `src/lib/page-titles.ts` (drives metadata and OG images).
3. Add a nav entry in `src/lib/docs-navigation.ts` (drives the sidebar, mobile nav, and sitemap).

## Verification

`pnpm check` (typecheck + production build) must pass before committing. Run it with `NEXT_DIST_DIR=.next-check` if a dev server may be running.
