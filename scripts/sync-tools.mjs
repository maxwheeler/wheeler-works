// Pull tool descriptions + images from their origin repos into src/content/tools.
//
// Each tool listed in tool-origins.json owns its content in its OWN repo (a
// `*-description.md` following the template: a "## Short description" section for
// the home-page card and a "## Long-form description" section for the detail page,
// with images referenced as images/*.png next to the source file). This script is
// run before every build (see package.json "build"), so editing the source md in
// the origin repo is all that's needed — the generated .mdx here is a build artifact.

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOOLS_DIR = join(ROOT, "src/content/tools");
const ORIGINS = JSON.parse(readFileSync(join(ROOT, "tool-origins.json"), "utf8"));

// Content of a "## Heading" section, up to the next "## " heading or "---" divider.
// (### subheadings inside the section are preserved — only level-2 headings end it.)
function section(md, headingRe) {
  const m = headingRe.exec(md);
  if (!m) return null;
  const rest = md.slice(m.index + m[0].length);
  const end = rest.search(/^\s*(##[^#]|---\s*$)/m);
  return (end === -1 ? rest : rest.slice(0, end)).trim();
}

const stripEmphasis = (s) => s.replace(/\*\*?([^*]+)\*\*?/g, "$1");
const linkifyBareUrls = (s) =>
  s.replace(/(?<!\]\()(https?:\/\/[^\s)]+)/g, "[$1]($1)");

let changed = 0;
for (const t of ORIGINS) {
  const srcMd = resolve(ROOT, t.source);
  if (!existsSync(srcMd)) {
    console.warn(`[sync] SKIP ${t.slug}: source not found (${t.source})`);
    continue;
  }
  const md = readFileSync(srcMd, "utf8");
  const srcDir = dirname(srcMd);

  const shortRaw = section(md, /^##\s+Short description.*$/im);
  const longRaw = section(md, /^##\s+Long-form description.*$/im);
  if (!shortRaw || !longRaw) {
    console.warn(`[sync] SKIP ${t.slug}: missing Short/Long-form section`);
    continue;
  }

  const description = stripEmphasis(shortRaw.replace(/\s+/g, " ").trim());
  // The intro link line: any bold label (Play it: / Use it: / See it: / Get it: …)
  // whose text carries a URL. Kept verb-agnostic so every tool includes it.
  const play = md.match(/^(\*\*[^*\n]+\*\*)[ \t]*(.+)$/im);
  const playLine =
    play && /https?:\/\//.test(play[2])
      ? `${play[1]} ${linkifyBareUrls(play[2].trim())}`
      : null;

  // Rebuild the asset folder from scratch: images (and icon) copied in from origin.
  const assetDir = join(TOOLS_DIR, t.slug);
  rmSync(assetDir, { recursive: true, force: true });
  mkdirSync(assetDir, { recursive: true });

  const missing = new Set();
  for (const ref of new Set(
    [...longRaw.matchAll(/!\[[^\]]*\]\((images\/[^)]+)\)/g)].map((m) => m[1]),
  )) {
    const from = join(srcDir, ref);
    if (existsSync(from)) copyFileSync(from, join(assetDir, basename(ref)));
    else {
      missing.add(ref);
      console.warn(`[sync] ${t.slug}: image not found, dropping from page — ${ref}`);
    }
  }

  let body = longRaw;
  // Drop the embed (and its caption line) for any image that doesn't exist, so a
  // missing/optional screenshot degrades gracefully instead of failing the build.
  for (const ref of missing) {
    const esc = ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    body = body.replace(
      new RegExp(`\\n*!\\[[^\\]]*\\]\\(${esc}\\)\\n(?:\\*[^\\n]*\\*\\n)?`, "g"),
      "\n\n",
    );
  }

  // Point remaining body image paths at the copied assets, relative to the .mdx.
  body = body.replace(
    /\(images\/([^)]+)\)/g,
    (_, name) => `(./${t.slug}/${basename(name)})`,
  );

  let iconField = "";
  if (t.icon) {
    const iconFrom = resolve(ROOT, t.icon);
    if (existsSync(iconFrom)) {
      copyFileSync(iconFrom, join(assetDir, "icon.png"));
      iconField = `\nicon: ./${t.slug}/icon.png`;
    } else {
      console.warn(`[sync] ${t.slug}: missing icon ${t.icon}`);
    }
  }

  const out =
    `---\n` +
    `title: ${JSON.stringify(t.title)}\n` +
    `description: ${JSON.stringify(description)}${iconField}\n` +
    `---\n\n` +
    (playLine ? `${playLine}\n\n` : "") +
    `${body}\n`;

  const mdxPath = join(TOOLS_DIR, `${t.slug}.mdx`);
  const prev = existsSync(mdxPath) ? readFileSync(mdxPath, "utf8") : null;
  writeFileSync(mdxPath, out);
  const state = prev === out ? "unchanged" : prev ? "UPDATED" : "CREATED";
  if (state !== "unchanged") changed++;
  console.log(`[sync] ${state} ${t.slug}`);
}
console.log(`[sync] done — ${ORIGINS.length} tool(s), ${changed} changed`);
