import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const platform = z.enum(["Web", "Mobile", "Desktop", "CLI"]);

export type Platform = z.infer<typeof platform>;

const tools = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/tools" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      icon: image().optional(),
      tags: z.array(z.string()).default([]),
      platforms: z.array(platform).default([]),
      status: z.enum(["active", "beta", "archived"]),
      githubUrl: z.string().url().optional(),
      date: z.coerce.date(),
      featured: z.boolean().default(false),
    }),
});

export const collections = { tools };
