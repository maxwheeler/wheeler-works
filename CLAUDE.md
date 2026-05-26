# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace setup

This app is a **pnpm workspace member** rooted in a separate repo. The
workspace lives at `/Users/maxwheeler/source/wheeler-works-ui-lib` and that
repo's `pnpm-workspace.yaml` lists `../wheeler-works` as a member. pnpm walks
upward to find the workspace file, so all pnpm commands run from the ui-lib
root with `--filter wheeler-works`:

```sh
cd /Users/maxwheeler/source/wheeler-works-ui-lib
pnpm install                          # touches every workspace member
pnpm --filter wheeler-works dev
pnpm --filter wheeler-works build
pnpm --filter wheeler-works check
```

Do **not** run `pnpm install` from inside this repo. pnpm won't find the
workspace and will fail to resolve the `workspace:*` deps. There is no
package-lock.json; the lockfile lives in the ui-lib root.

If you only need to drive a script from within this repo, the npm-style
fallback `npx astro dev` works because the symlinked `node_modules` is real.
But anything that resolves the workspace (install, add, deploy) must run from
the ui-lib root.

## Commands

All run from the ui-lib root:

- Dev server: `pnpm --filter wheeler-works dev`
- Build: `pnpm --filter wheeler-works build`
- Preview: `pnpm --filter wheeler-works preview`
- Type/diagnostics check: `pnpm --filter wheeler-works check`

No test runner is configured.

## Architecture

Astro 6 static site, React + MDX islands, Tailwind v4 via the shared
`@wheeler-works/ui-react` styles entry.

- `src/content.config.ts` — defines the single `tools` content collection.
  Uses the `glob` loader against `src/content/tools/**/*.{md,mdx}`. Schema is
  intentionally narrow — only fields used in card/list views or page chrome:
  `title`, `description` (one-line card snippet), optional `icon` (an
  `image()` reference; cards/header fall back to a letter placeholder when
  absent), `tags`, `platforms` enum (Web, Mobile, Desktop, CLI), `status`
  enum (`active` | `beta` | `archived`), optional `githubUrl`, `date`
  (coerced), `featured` boolean. All prose, images, and interactive demos
  live in the MDX body — nothing long-form goes in YAML.
- `src/pages/index.astro` — loads all tools, serializes them (date → ISO
  string, `image()` → `.src`) and passes them with the deduped tag list to
  the `ToolGrid` React island. Sorting by date happens here on the server.
- `src/components/ToolGrid.tsx` — React island (`client:load`). Owns tag
  filter state (AND semantics across selected tags). Uses `Badge` and
  `Button` from `@wheeler-works/ui-react`. Only client-side JS on the site.
- `src/pages/tools/[...slug].astro` — dynamic detail route built via
  `getStaticPaths` from the collection. Uses `Badge` and `Prose` from
  `@wheeler-works/ui-astro` (those are native `.astro` components — no React
  hydration). To embed screenshots, reference relative paths inside the MDX
  body; Astro's asset pipeline handles them. Interactive demos work the
  same way: import a React component and render it inline.
- `src/layouts/BaseLayout.astro` — single layout used by every page.
  Includes an inline script that mirrors `prefers-color-scheme` →
  `.dark` class on `<html>`, because the library's tokens key off `.dark`
  rather than the media query directly.

## Conventions

- **Design tokens, not raw palette.** Use `bg-background`, `text-foreground`,
  `text-muted-foreground`, `border-border`, `bg-surface`, `bg-muted`, and the
  semantic variants on `Badge`/`Button` (`success`, `warning`, `outline`,
  etc.). Don't reach for `neutral-*` / `gray-*` / `emerald-*` directly — the
  whole point of the ui-lib is that those are tokenized.
- **Dark mode is class-based.** The library's `.dark` override on CSS vars
  is the only mechanism; `dark:` Tailwind variants on tokenized utilities
  are unnecessary (and will diverge from light-mode values). The
  BaseLayout's inline script sets the class from `prefers-color-scheme`. If
  you ever want a manual toggle, replace that script with a useDarkMode
  pattern (see feedme for the reference).
- **Tailwind config is CSS-only.** `src/styles/global.css` imports
  `@wheeler-works/ui-react/styles.css` (which brings Tailwind + plugins +
  tokens) and declares `@source` so Tailwind scans this repo's source.
  There is no `tailwind.config.*`.
- **Adding a new tool** = drop a single `.mdx` file under
  `src/content/tools/`. The filename (without extension) becomes the slug
  at `/tools/<slug>`. Co-locate an `<slug>.png` (or any image) and reference
  it from frontmatter as `icon: ./<slug>.png` for an app-style icon; absence
  is fine — the card renders a letter placeholder.
- **Don't edit ui-lib component source from here.** If `ToolGrid` needs
  something a library component doesn't expose, raise the gap with the
  ui-lib rather than working around it locally.

## Deploy

Static Astro site → Flavor 2 of `DEPLOYING.md` in the ui-lib repo: build the
deploy snapshot with `pnpm deploy --legacy`, then `./node_modules/.bin/astro
build` inside the snapshot, then ship the `dist/` directory through nginx.
**Deploy target is not yet wired up** — ask Max where this site should live
the first time you deploy it.
