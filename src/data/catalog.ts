import type * as Catalog from './capabilities';

/**
 * Acesso ao catálogo de capacidades fora do bundle inicial: o módulo (6 idiomas × 15 capacidades) vive
 * num chunk próprio, carregado em PARALELO com o dicionário antes de hidratar (entry-client) e antes de
 * renderizar no SSR (entry-server). Assim o HTML pré-renderizado e a 1.ª renderização do cliente são iguais
 * (sem desacertos de hidratação) e o JS crítico não cresce. O Mega Brain (lazy) partilha o mesmo chunk.
 */
let mod: typeof Catalog | null = null;

export const loadCatalog = (): Promise<typeof Catalog> => import('./capabilities').then((m) => (mod = m));

export function catalog(): typeof Catalog {
  if (!mod) throw new Error('catálogo ainda não carregado — chamar loadCatalog() antes de renderizar');
  return mod;
}
