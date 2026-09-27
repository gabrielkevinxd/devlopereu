import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { loadCatalog } from './data/catalog';
import { loadDict } from './i18n';
import { parsePath } from './routes';

/** Deixa o browser pintar primeiro o HTML pré-renderizado; só depois hidrata. */
const afterFirstPaint = () => new Promise<void>((r) => requestAnimationFrame(() => setTimeout(r, 0)));

async function boot() {
  const { lang, page } = parsePath(window.location.pathname);
  // catálogo (só na página inicial) em paralelo com o dicionário → hidratação igual ao HTML pré-renderizado
  const [dict] = await Promise.all([loadDict(lang), page === 'home' ? loadCatalog() : null, afterFirstPaint()]);
  const root = document.getElementById('root')!;
  const app = (
    <StrictMode>
      <App lang={lang} page={page} dict={dict} />
    </StrictMode>
  );
  // HTML pré-renderizado → hidratar; em `vite dev` o root está vazio → render normal.
  if (root.firstElementChild) hydrateRoot(root, app);
  else createRoot(root).render(app);
  document.documentElement.classList.add('js');
}

void boot();

// Remove o service worker do site antigo (vite-plugin-pwa) que servia versões em cache.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
}
