# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace setup

This app is a **pnpm workspace member** rooted in a separate repo. The
workspace lives at `/Users/maxwheeler/source/wheeler-works-ui-lib` and that
repo's `pnpm-workspace.yaml` lists `../wheeler-works` as a member. There is
no `package-lock.json` or local lockfile in this repo — the lockfile lives
in the ui-lib root, and `node_modules/@wheeler-works/*` are symlinks
maintained by `pnpm install` run from over there.

**Day-to-day work happens from inside this repo with `npm run <script>`.**
Trips to the ui-lib root are only needed for two things:

1. **Dep changes** — adding or upgrading any package, including
   `@wheeler-works/*` whose `workspace:*` version pin is satisfied by the
   symlink. Run `pnpm install` (or `pnpm add <pkg> --filter wheeler-works`)
   from the ui-lib root, then come back here.
2. **Cross-cutting UI changes** — when something needs to land in the ui-lib
   itself (a new component, a token tweak), edit there. The symlinks pick
   the change up live.

Don't run `pnpm <script>` from inside this repo. pnpm 11's
`verify-deps-before-run` precheck calls `pnpm install`, which fails because
pnpm walks upward looking for `pnpm-workspace.yaml` and doesn't find one.
`npm run <script>` and direct binary invocations like
`./node_modules/.bin/astro dev` skip that precheck and just work — they only
need the symlinks, which are already in place.

## Commands

All run from this repo's root:

- Dev server: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Type/diagnostics check: `npm run check`
- Deploy to Firebase: `firebase deploy --only hosting` (after a build)

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

## Dev server gotchas

- **Content-sync wedges on validation errors.** If an MDX edit doesn't
  appear in the browser, the terminal output is the source of truth — look
  there first. A failed schema validation (e.g. a `platforms` value not in
  the enum) leaves the dev server serving the last *successful* state and
  silently dropping subsequent edits. Recovery: Ctrl+C, restart. If that
  doesn't clear it, `rm -rf .astro` and restart.
- **Schema changes need a dev server restart.** Editing
  `src/content.config.ts` itself (adding fields, changing enums) won't HMR
  reliably. Restart the dev server.

## Deploy

Site is live at https://wheelerworks.us via Firebase Hosting (project
`wheeler-works`). `www.wheelerworks.us` 301-redirects to the apex,
configured at the domain level in the Firebase console (no second hosting
site needed). Caching: `_astro/**` hashed assets get 1y immutable; HTML
gets 5min must-revalidate.

Going-forward deploy is two commands:

```sh
npm run build
firebase deploy --only hosting
```

GitHub remote: https://github.com/maxwheeler/wheeler-works (public).
