import { useMemo, useState } from "react";

export type Platform = "Web" | "Mobile" | "Desktop" | "CLI";

export type ToolCard = {
  slug: string;
  title: string;
  description: string;
  iconSrc: string | null;
  tags: string[];
  platforms: Platform[];
  status: "active" | "beta" | "archived";
  date: string;
  featured: boolean;
  githubUrl?: string;
};

type Props = {
  tools: ToolCard[];
  allTags: string[];
};

const statusStyles: Record<ToolCard["status"], string> = {
  active:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  beta: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  archived:
    "bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400",
};

const statusLabels: Record<ToolCard["status"], string> = {
  active: "Available",
  beta: "In beta",
  archived: "Archived",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });
}

function ToolIcon({ src, title }: { src: string | null; title: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="w-12 h-12 rounded-md object-cover shrink-0 border border-neutral-200 dark:border-neutral-800"
      />
    );
  }
  return (
    <div
      role="presentation"
      className="w-12 h-12 rounded-md shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-400 font-medium text-lg select-none"
    >
      {title.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ToolGrid({ tools, allTags }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (tag: string) =>
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const filtered = useMemo(() => {
    if (selected.length === 0) return tools;
    return tools.filter((t) => selected.every((s) => t.tags.includes(s)));
  }, [tools, selected]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-neutral-500 mr-2">
          Filter
        </span>
        {allTags.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={
                "px-2.5 py-1 text-xs rounded-full border transition-colors " +
                (active
                  ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100"
                  : "border-neutral-300 text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500")
              }
            >
              {tag}
            </button>
          );
        })}
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            className="ml-1 text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No tools match the selected tags.
        </p>
      ) : (
        <ul className="grid gap-4">
          {filtered.map((tool) => (
            <li key={tool.slug}>
              <a
                href={`/tools/${tool.slug}`}
                className="flex gap-4 rounded-lg border border-neutral-200 dark:border-neutral-800 p-5 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
              >
                <ToolIcon src={tool.iconSrc} title={tool.title} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-lg font-medium tracking-tight">
                      {tool.title}
                      {tool.featured && (
                        <span
                          className="ml-2 align-middle text-[10px] uppercase tracking-wider text-neutral-500"
                          title="Featured"
                        >
                          featured
                        </span>
                      )}
                    </h2>
                    <time className="text-xs text-neutral-500 shrink-0">
                      {formatDate(tool.date)}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                    {tool.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={
                        "px-2 py-0.5 text-xs rounded-full " +
                        statusStyles[tool.status]
                      }
                    >
                      {statusLabels[tool.status]}
                    </span>
                    {tool.platforms.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 text-xs rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                      >
                        {p}
                      </span>
                    ))}
                    {tool.tags.length > 0 && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {tool.tags.join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
