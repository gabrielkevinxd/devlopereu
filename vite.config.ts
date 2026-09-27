import { defineConfig, loadEnv, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { createAgentMiddleware } from './server/agent/handler';

// Runtime: Preact (API React via preact/compat, ~10 kB) — o código continua escrito em React/TS.
// Build em 3 passos (ver package.json): cliente → SSR → scripts/prerender.mjs gera HTML estático por idioma.

/** /api/agent.php em `vite dev` e `vite preview` (em produção responde o PHP em public/api/agent.php). */
function agentApi(env: Record<string, string>): Plugin {
  const mw = createAgentMiddleware(env);
  return {
    name: 'devloper-agent-api',
    configureServer: (server) => void server.middlewares.use(mw),
    configurePreviewServer: (server) => void server.middlewares.use(mw),
  };
}

export default defineConfig(({ mode }) => {
  // Lê .env / .env.local (todas as variáveis, não só VITE_*): as chaves ficam no servidor, nunca no bundle.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env } as Record<string, string>;
  return {
    plugins: [preact(), agentApi(env)],
    build: {
      target: 'es2020',
      cssCodeSplit: false,
      reportCompressedSize: false,
      // manifesto → a pré-renderização sabe o nome dos chunks do dicionário e do catálogo (modulepreload)
      manifest: true,
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});
