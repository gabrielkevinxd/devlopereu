# DevloperEU

Aplicação React + TypeScript construída com Vite e Tailwind, com suporte a i18n e PWA.

## Requisitos
- Node.js 18+
- npm 9+

## Instalação e execução
```bash
npm ci
npm run dev
```

## Build de produção
```bash
npm run build
```
Os arquivos gerados ficam em `dist/`. Para conveniência de deploy manual, um `dist.zip` pode ser criado com:
```powershell
Compress-Archive -Path .\\dist\\* -DestinationPath .\\dist.zip -Force
```

## Internacionalização
As traduções usam i18next. Placeholders devem seguir o padrão `{{variavel}}` (ex.: `{{date}}`).

## Estrutura principal
- `src/pages`: páginas (Home, Termos, Privacidade, Cookies)
- `src/components`: componentes reutilizáveis
- `src/locales`: traduções por idioma
- `vite.config.ts`: configuração Vite

## Deploy
Consulte `DEPLOYMENT.md` para instruções detalhadas de Vercel, Netlify e GitHub Pages.