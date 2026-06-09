import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

/** Splits large dashboard libraries into cacheable client chunks. */
function splitDashboardChunks(id) {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (id.includes("zrender")) {
    return "charts-renderer";
  }

  if (id.includes("echarts")) {
    return "charts";
  }

  if (id.includes("@cloudflare/kumo") || id.includes("@base-ui-components")) {
    return "kumo";
  }

  if (
    id.includes("react-dom") ||
    id.includes("react/") ||
    id.includes("scheduler")
  ) {
    return "react";
  }

  if (id.includes("@tanstack")) {
    return "tanstack";
  }

  if (id.includes("d3-geo") || id.includes("internmap")) {
    return "maps";
  }

  return "vendor";
}

export default defineConfig({
  integrations: [react()],
  output: "static",
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: splitDashboardChunks,
        },
      },
    },
    plugins: [tailwindcss()],
  },
});
