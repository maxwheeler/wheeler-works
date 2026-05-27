import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

const uiLibRoot = fileURLToPath(
  new URL("../wheeler-works-ui-lib", import.meta.url),
);

export default defineConfig({
  site: "https://wheeler.works",
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      fs: {
        allow: [".", uiLibRoot],
      },
    },
  },
});
