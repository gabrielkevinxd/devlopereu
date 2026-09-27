/**
 * Etiquetas da órbita do Mega Brain sem colisões.
 * Cada etiqueta (módulos ativos + o selecionado) tem posições candidatas à volta do módulo, por ordem de
 * preferência: radial para fora → para dentro na horizontal (alinhada à esquerda/direita conforme o lado)
 * → radial para dentro → restantes direções; cada uma a 5 distâncias e em 3 larguras (larga, estreita,
 * compacta) e, em último caso, abreviada. Só contam as que cabem no reator sem tocar em nenhum módulo nem no núcleo. Uma busca com
 * retrocesso limitado escolhe a combinação sem sobreposições que mostra mais etiquetas (e, em empate,
 * as posições preferidas). Se mesmo assim uma não couber fica escondida — o nome completo continua no
 * tooltip (hover/foco), no aria-label e no painel.
 */
export interface Box {
  x: number;
  y: number;
  r: number;
  b: number;
}
export interface LabelIn {
  /** índice do módulo na órbita */
  node: number;
  cx: number;
  cy: number;
  /** raio do ponto do módulo (px) */
  radius: number;
  /** ângulo do módulo visto do centro (rad) */
  angle: number;
  /** tamanho da etiqueta em cada variante, da preferida para a mais compacta */
  sizes: { w: number; h: number }[];
  /** módulo selecionado: a etiqueta é obrigatória (nunca é a escondida) */
  must?: boolean;
}
export interface LabelOut {
  x: number;
  y: number;
  variant: number;
  align: 'left' | 'right' | 'center';
}

const DEG = Math.PI / 180;
const GAP = 6; // distância ao ponto
const PAD = 3; // folga mínima entre caixas

/** Módulos e núcleo são círculos: colisão caixa-círculo (deixa usar o espaço dos cantos). */
export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export const hit = (a: Box, b: Box, pad = 0) => a.x < b.r + pad && b.x < a.r + pad && a.y < b.b + pad && b.y < a.b + pad;
export const hitCircle = (a: Box, c: Circle, pad = 0) => {
  const dx = c.cx - Math.max(a.x, Math.min(c.cx, a.r));
  const dy = c.cy - Math.max(a.y, Math.min(c.cy, a.b));
  return dx * dx + dy * dy < (c.r + pad) ** 2;
};

function candidates(a: number, cx: number, center: number): number[] {
  const out = a;
  const inn = a + Math.PI;
  const side = Math.abs(Math.cos(a)) > 0.3 ? (cx > center ? Math.PI : 0) : inn; // para dentro na horizontal
  const list = [out, out + 20 * DEG, out - 20 * DEG, out + 40 * DEG, out - 40 * DEG, side, inn, inn + 25 * DEG, inn - 25 * DEG, inn + 50 * DEG, inn - 50 * DEG];
  list.push(out + 65 * DEG, out - 65 * DEG, out + 90 * DEG, out - 90 * DEG, Math.PI / 2, -Math.PI / 2, 0, Math.PI, inn + 75 * DEG, inn - 75 * DEG);
  return list;
}

/** Caixa de tamanho w×h encostada ao ponto na direção `ang` (a aresta/canto mais próximo toca a folga). */
function boxAt(l: LabelIn, ang: number, w: number, h: number): { box: Box; align: LabelOut['align'] } {
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const m = Math.max(Math.abs(ux), Math.abs(uy));
  const d = l.radius + GAP;
  const mx = l.cx + ux * d + (w / 2) * (ux / m);
  const my = l.cy + uy * d + (h / 2) * (uy / m);
  const align = ux / m > 0.5 ? 'left' : ux / m < -0.5 ? 'right' : 'center';
  return { box: { x: mx - w / 2, y: my - h / 2, r: mx + w / 2, b: my + h / 2 }, align };
}

interface Cand {
  box: Box;
  align: LabelOut['align'];
  variant: number;
  cost: number;
}
const DIST = [0, 6, 12, 20, 30]; // afastamentos extra ao ponto (px)
const ASSOC = 1; // a etiqueta tem de estar mais perto do seu módulo do que de qualquer outro
const distTo = (a: Box, c: Circle) => Math.hypot(c.cx - Math.max(a.x, Math.min(c.cx, a.r)), c.cy - Math.max(a.y, Math.min(c.cy, a.b)));
const MAX_CANDS = 32;
const BUDGET = 40000; // limite de passos da busca (tempo constante, mesmo no pior caso)

/**
 * Busca com retrocesso limitado: maximiza o nº de etiquetas visíveis e, em empate, o custo total
 * (direção preferida, perto do ponto, versão larga). As etiquetas com menos opções são colocadas primeiro.
 */
export function placeLabels(labels: LabelIn[], nodes: Circle[], core: Circle, bounds: Box): (LabelOut | null)[] {
  const center = (bounds.x + bounds.r) / 2;
  const obstacles = [...nodes, core];
  const cands: Cand[][] = labels.map((l) => {
    const list: Cand[] = [];
    l.sizes.forEach(({ w, h }, variant) =>
      candidates(l.angle, l.cx, center).forEach((ang, k) =>
        DIST.forEach((extra, di) => {
          const { box, align } = boxAt({ ...l, radius: l.radius + extra }, ang, w, h);
          if (box.x < bounds.x || box.y < bounds.y || box.r > bounds.r || box.b > bounds.b) return;
          if (obstacles.some((o) => hitCircle(box, o, PAD))) return;
          // sem ambiguidade: mais perto do próprio módulo do que de qualquer outro
          const own = distTo(box, nodes[l.node]);
          if (nodes.some((n, j) => j !== l.node && distTo(box, n) < own + ASSOC)) return;
          list.push({ box, align, variant, cost: k + di * 3 + variant * 9 });
        }),
      ),
    );
    return list.sort((a, b) => a.cost - b.cost).slice(0, MAX_CANDS);
  });
  const order = labels.map((_, i) => i).sort((a, b) => Number(!!labels[b].must) - Number(!!labels[a].must) || cands[a].length - cands[b].length);
  let best: { shown: number; cost: number; pick: (Cand | null)[] } = { shown: -1, cost: Infinity, pick: [] };
  const pick: (Cand | null)[] = labels.map(() => null);
  let steps = 0;
  const dfs = (k: number, shown: number, cost: number, placed: Box[]) => {
    if (steps++ > BUDGET) return;
    if (shown + (order.length - k) < best.shown) return; // não consegue melhorar
    if (k === order.length) {
      if (shown > best.shown || (shown === best.shown && cost < best.cost)) best = { shown, cost, pick: [...pick] };
      return;
    }
    const i = order[k];
    for (const c of cands[i]) {
      if (placed.some((p) => hit(c.box, p, PAD))) continue;
      pick[i] = c;
      placed.push(c.box);
      dfs(k + 1, shown + 1, cost + c.cost, placed);
      placed.pop();
      pick[i] = null;
      if (best.shown === order.length && best.cost <= cost + c.cost) break; // já há solução completa melhor
    }
    if (!labels[i].must || !cands[i].length) dfs(k + 1, shown, cost, placed); // sem etiqueta (escondida)
  };
  dfs(0, 0, 0, []);
  return best.pick.map((c) => (c ? { x: c.box.x, y: c.box.y, variant: c.variant, align: c.align } : null));
}

const VARIANTS = ['wide', 'narrow', 'compact', 'short'] as const;

/** Abreviatura (último recurso): a sigla entre parênteses, senão a 1.ª palavra (ou as 2 primeiras se for curta). */
export function shortName(name: string): string {
  const acro = name.match(/\(([^)]+)\)\s*$/);
  if (acro) return acro[1];
  const w = name.split(/\s+/);
  return w[0].length < 5 && w.length > 1 ? `${w[0]} ${w[1]}` : w[0];
}

/** Mede e posiciona as etiquetas `.mb-tag` dentro do reator (coordenadas relativas ao reator). */
export function layoutTags(root: HTMLElement): void {
  const tags = [...root.querySelectorAll<HTMLElement>('.mb-tag')];
  if (!tags.length) return;
  for (const t of tags) delete t.dataset.hidden;
  if (getComputedStyle(tags[0]).display === 'none') return; // ecrãs estreitos: sem etiquetas (como antes)
  const W = root.clientWidth;
  const H = root.clientHeight;
  // centros pelos % da órbita (não pelo getBoundingClientRect: o selecionado tem scale animado)
  const nodes: Circle[] = [...root.querySelectorAll<HTMLElement>('.mb-node')].map((n) => {
    const dot = n.querySelector<HTMLElement>('.mb-node__dot');
    const scale = n.classList.contains('is-sel') ? 1.14 : 1; // scale do módulo selecionado (CSS)
    return { cx: (parseFloat(n.style.left) / 100) * W, cy: (parseFloat(n.style.top) / 100) * H, r: ((dot?.offsetWidth ?? 40) * scale) / 2 };
  });
  const coreEl = root.querySelector<HTMLElement>('.mb__core');
  const core = { cx: W / 2, cy: H / 2, r: coreEl ? coreEl.offsetWidth / 2 : 0 };
  const input: LabelIn[] = tags.map((tag) => {
    const node = Number(tag.dataset.i);
    const n = nodes[node];
    tag.style.transform = 'none';
    const sizes = VARIANTS.map((v) => {
      tag.dataset.fit = v;
      tag.style.width = '';
      // largura real do texto (linha mais larga), para a caixa não ficar maior do que o texto quando quebra
      const range = document.createRange();
      range.selectNodeContents(tag.querySelector(v === 'short' ? '.mb-tag__short' : '.mb-tag__full') ?? tag);
      const line = Math.max(0, ...[...range.getClientRects()].map((r) => r.width));
      const w = Math.min(tag.offsetWidth, Math.ceil(line + tag.offsetWidth - tag.clientWidth + parseFloat(getComputedStyle(tag).paddingLeft) * 2 + 1));
      tag.style.width = `${w}px`;
      return { w, h: tag.offsetHeight };
    });
    return { node, cx: n.cx, cy: n.cy, radius: n.r, angle: Math.atan2(n.cy - H / 2, n.cx - W / 2), sizes, must: tag.classList.contains('is-sel') };
  });
  placeLabels(input, nodes, core, { x: 0, y: 0, r: W, b: H }).forEach((o, k) => {
    const tag = tags[k];
    if (!o) {
      tag.dataset.hidden = '';
      return;
    }
    tag.dataset.fit = VARIANTS[o.variant];
    tag.style.width = `${input[k].sizes[o.variant].w}px`;
    tag.dataset.align = o.align;
    tag.style.transform = `translate(${o.x.toFixed(1)}px, ${o.y.toFixed(1)}px)`;
  });
}
