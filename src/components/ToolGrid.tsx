import { useMemo, useState } from "react";
import { Badge, Button } from "@wheeler-works/ui-react";

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

const statusVariant: Record<
  ToolCard["status"],
  "success" | "warning" | "outline"
> = {
  active: "success",
  beta: "warning",
  archived: "outline",
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
        className="w-12 h-12 rounded-md object-cover shrink-0 border border-border"
      />
    );
  }
  return (
    <div
      role="presentation"
      className="w-12 h-12 rounded-md shrink-0 bg-muted text-muted-foreground border border-border flex items-center justify-center font-medium text-lg select-none"
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
        <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">
          Filter
        </span>
        {allTags.map((tag) => {
          const active = selected.includes(tag);
          return (
            <Button
              key={tag}
              variant={active ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => toggle(tag)}
            >
              {tag}
            </Button>
          );
        })}
        {selected.length > 0 && (
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground px-1"
            onClick={() => setSelected([])}
          >
            clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tools match the selected tags.
        </p>
      ) : (
        <ul className="grid gap-4">
          {filtered.map((tool) => (
            <li key={tool.slug}>
              <a
                href={`/tools/${tool.slug}`}
                className="flex gap-4 rounded-lg border border-border bg-surface p-5 hover:border-foreground/40 transition-colors"
              >
                <ToolIcon src={tool.iconSrc} title={tool.title} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 className="text-lg font-medium tracking-tight text-foreground">
                      {tool.title}
                      {tool.featured && (
                        <span
                          className="ml-2 align-middle text-[10px] uppercase tracking-wider text-muted-foreground"
                          title="Featured"
                        >
                          featured
                        </span>
                      )}
                    </h2>
                    <time className="text-xs text-muted-foreground shrink-0">
                      {formatDate(tool.date)}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {tool.description}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant[tool.status]}>
                      {statusLabels[tool.status]}
                    </Badge>
                    {tool.platforms.map((p) => (
                      <Badge key={p} variant="outline">
                        {p}
                      </Badge>
                    ))}
                    {tool.tags.length > 0 && (
                      <span className="text-xs text-muted-foreground">
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
