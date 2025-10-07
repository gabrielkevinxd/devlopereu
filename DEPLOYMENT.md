# Guia de Deploy

Este projeto é uma SPA gerada por Vite com saída em `dist/`. Abaixo, as opções recomendadas de deploy.

## Vercel
- Framework: `Vite`
- Comando de build: `npm run build`
- Diretório de saída: `dist`
- Node: `18`
- Variáveis de ambiente: não requerem configuração especial.
- Passos:
  1. Crie novo projeto no Vercel e conecte ao repositório GitHub.
  2. Vercel detectará Vite automaticamente; confirme `Output Directory: dist`.
  3. Deploy será automático a cada push em `main`.

## Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Node: `18`
- Passos:
  1. Crie novo site a partir do repositório.
  2. Configure build e publish conforme acima.

## GitHub Pages
Para GitHub Pages servir corretamente rotas de SPA, ajuste o `base` do Vite se publicar em um subcaminho.

### Passos
1. Se o repositório for `usuario/DevloperEU`, ative Pages em `Settings > Pages` e escolha ação de deploy do `dist`.
2. Caso precise publicar em `https://usuario.github.io/DevloperEU/`, defina `base: '/DevloperEU/'` no `vite.config.ts`.
3. Faça push para `main` e aguarde o build.

## Deploy manual (Apache/Nginx)
1. Gere o build: `npm run build`.
2. Faça upload do conteúdo de `dist/` (ou `dist.zip` e descompacte) para o servidor.
3. Configure rewrite para SPA (rotas internas redirecionadas para `index.html`).

## Dicas
- Sempre gere build antes de publicar (`npm run build`).
- Verifique que `{{date}}` e outros placeholders estejam interpolados nas traduções.