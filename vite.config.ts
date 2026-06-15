import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// El plugin de Cloudflare ejecuta el Worker (worker/index.ts) y D1 en local
// durante `vite dev`, sirviendo el SPA y el API /api/* en el mismo origen.
// Toma la configuración de wrangler.jsonc.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
});
