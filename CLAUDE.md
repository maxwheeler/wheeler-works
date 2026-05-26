# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Dev server: `npm run dev`
- Build: `npm run build`
- Preview built site: `npm run preview`
- Type/diagnostics check: `npm run check` (runs `astro check`)

There is no test runner configured.

## Architecture

Astro 6 static site, Tailwind v4, React + MDX islands.

- `src/content.config.ts` — defines the single `tools` content collection. Uses the `glob` loader against `src/content/tools/**/*.{md,mdx}`. Schema is intentionally narrow — only fields used in card/list views or page chrome: `title`, `description` (one-line snippet for cards), optional `icon` (an `image()` reference; cards/header fall back to a letter placeholder when absent), `tags`, `platforms` (enum: Web, Mobile, Desktop, CLI), `status` enum (`active` | `beta` | `archived`), optional `githubUrl`, `date` (coerced), `featured` boolean. All prose, images, and interactive demos live in the MDX body — nothing long-form goes in YAML.
- `src/pages/index.astro` — loads all tools, serializes them to plain JSON (date → ISO string) and passes them along with the deduped tag list to the `ToolGrid` React island. Sorting by date happens here on the server.
- `src/components/ToolGrid.tsx` — React island (`client:load`) that owns tag-filter state. Filtering uses AND semantics across selected tags. This is the only client-side JS on the site.
- `src/pages/tools/[...slug].astro` — dynamic detail route built via `getStaticPaths` from the collection. Renders header chrome (status, date, title, description, tags, GitHub link) then `<Content />` for the MDX body inside a `prose` wrapper. To embed screenshots, import or reference them inside the MDX body — Astro's asset pipeline handles relative image paths. Interactive demos work the same way: import a React component and render it inline.
- `src/layouts/BaseLayout.astro` + `src/components/SiteHeader.astro` / `SiteFooter.astro` — single layout used by every page. Header reads `Astro.url.pathname` to mark the active nav link.

## Conventions

- Vite is pinned via the `overrides` field in `package.json` to keep Astro 6 (Vite 7) and `@tailwindcss/vite` on the same Vite instance. Without this, npm hoists Vite 8 and the Tailwind plugin throws `tsconfigPaths` errors at build time. Don't remove the override unless you've verified Astro has moved to Vite 8.
- Tailwind v4 plugins are loaded from `src/styles/global.css` via `@plugin` (e.g. `@plugin "@tailwindcss/typography";`), not from a JS config. There is no `tailwind.config.*`.
- Adding a new tool = add a single `.mdx` file under `src/content/tools/`. The filename (without extension) becomes the slug at `/tools/<slug>`.
