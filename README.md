# DevloperEU — site v2 («o site é o agente»)

Conceito, jornada e momentos-chave: ver [`CONCEPT.md`](CONCEPT.md).
Agente com IA real (LLM, tool calls, voz), como ativar e custos: ver [`AGENT.md`](AGENT.md).

## Stack

- Vite 5 + TypeScript + componentes React (runtime **Preact** via `preact/compat`, ~10 kB)
- CSS próprio (tokens, `clamp()`, container queries), sem framework
- **SSG próprio**: cada idioma × página é pré-renderizado para HTML estático (`scripts/prerender.mjs`)
- i18n tipado: `src/i18n/pt.ts` é a fonte; `en/fr/es/de/sv` implementam o tipo `Dict`

## Comandos

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # typecheck → build cliente → build SSR → pré-render (dist/)
npm run preview    # serve dist/ em http://localhost:4173
npm run brand      # regenera logótipos/ícones a partir de scripts/brand-src (Python + Pillow)
```

## Estrutura

```
src/
  config.ts            contactos, CALENDAR_URL (TODO), Meta Pixel, CASE_STUDIES (TODO)
  routes.ts  seo.ts    rotas por idioma, <head>, JSON-LD
  i18n/                dicionários tipados (pt fonte)
  components/
    agent/             Workspace, Chat, Stage (+ stage/: Awake, Profile, Simulation, Capabilities, Done)
    booking/           BookingForm + lógica (dias úteis, mensagem WhatsApp/email)
    classic/           modo clássico (documento indexável)
    consent/           banner RGPD + Meta Pixel só após consentimento
    conversion/        exit-intent (1×, desktop, fechável)
    layout/ brand/     topbar, rodapé, idiomas, logótipo real responsivo
  pages/               páginas legais e checklist (lead magnet)
  ai/                  sessão LLM (streaming + tool calls) e voz — carregados só quando usados
server/agent/          endpoint /api/agent.php em vite dev/preview (TS)
public/api/            agent.php (produção, PHP) + agent-brain.json (prompt, tools, limites)
public/brand/          logótipo real (PNG/WebP/AVIF), gerado por scripts/brand.py
```

## TODO do dono

- Ativar o agente com IA: chave Gemini em `devloper-agent.env` fora do `public_html` — passos em [`AGENT.md`](AGENT.md).

- `src/config.ts → CALENDAR_URL`: link de agendamento (Cal.com/Calendly). Vazio = WhatsApp/email.
- `src/config.ts → CASE_STUDIES`: casos reais autorizados. Vazio = não aparece nada.
- Não existem preços, clientes nem testemunhos no site — por decisão, até haver dados reais.
