# Deploy

O `npm run build` gera um **site estático** em `dist/`: uma pasta com `index.html` por rota e idioma
(`/`, `/en/`, `/fr/`, `/es/`, `/de/`, `/sv/`, `…/privacy-policy/`, `…/cookie-policy/`, `…/terms/`,
`…/checklist/`), mais `sitemap.xml`, `robots.txt`, `404.html` e `.htaccess`. Não é preciso
servidor Node nem regras de SPA.

## Apache / hosting partilhado
1. `npm ci && npm run build`
2. Enviar o conteúdo de `dist/` (inclui `.htaccess`: HTTPS + domínio canónico, 404, cache, MIME AVIF/WebP).

## Vercel / Netlify / Cloudflare Pages
- Build: `npm run build` · Output: `dist` · Node 18+.
- Não configurar rewrites para `index.html` (cada rota tem o seu HTML).

## Agente com IA (`/api/agent.php`)
- Requer PHP ≥ 7.4 com cURL (standard em alojamento partilhado). Vai dentro de `dist/api/`.
- A chave NÃO vai no `dist/`: criar `devloper-agent.env` uma pasta acima de `public_html` (ver `AGENT.md`).
- Orçamento: o ledger fica em `devloper-agent-data/` uma pasta acima de `public_html` (criado automaticamente; tem de ser gravável). Painel: `/api/admin.html` com `AGENT_ADMIN_TOKEN`.
- Vercel/Netlify não executam PHP: aí o agente cai no fluxo guiado (seria preciso portar `server/agent` para uma função serverless).

## Notas
- `public/sw.js` é um «kill switch»: remove o service worker do site antigo (vite-plugin-pwa) nos
  browsers de visitantes antigos. Pode ser apagado ao fim de alguns meses.
- O Meta Pixel só é carregado depois de o visitante clicar «Aceitar» no banner de cookies.
