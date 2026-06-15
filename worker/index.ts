import { api, type Env } from "./api";

/* ============================================================
   Entry del Worker de CivicTech.
   - /api/*  → API REST (Hono + D1). Configurado en wrangler.jsonc
     con run_worker_first para invocar el Worker antes que los assets.
   - resto   → SPA estática servida desde ./dist (binding ASSETS).
     Las cabeceras de seguridad de los assets se definen en
     public/_headers (copiado a dist/ por Vite).
   ============================================================ */

interface WorkerEnv extends Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return api.fetch(request, env, ctx);
    }
    // Cualquier otra ruta la resuelve el binding de assets (con fallback SPA).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;
