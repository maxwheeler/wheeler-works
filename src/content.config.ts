import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const tools = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/tools" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      longDescription: z.string().optional(),
      screenshots: z.array(image()).default([]),
      tags: z.array(z.string()).default([]),
      status: z.enum(["active", "beta", "archived"]),
      githubUrl: z.string().url().optional(),
      date: z.coerce.date(),
      featured: z.boolean().default(false),
    }),
});

export const collections = { tools };
