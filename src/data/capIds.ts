/**
 * Ids do catálogo de capacidades (src/data/capabilities.ts), na ordem da órbita do Mega Brain.
 * Módulo leve à parte para o ecrã de arranque mostrar «N/N» sem carregar o catálogo inteiro (lazy).
 * O tipo CapId vem daqui, por isso o catálogo só compila com estes ids, e o teste
 * .verify/v5/catalog-check.cjs confirma que a lista e o catálogo têm exatamente os mesmos módulos.
 */
export const CAP_IDS = [
  'agentes-autonomos',
  'agente-voz',
  'whatsapp',
  'multi-agente',
  'rag-documentos',
  'visao-ocr',
  'copiloto-interno',
  'integracoes-mcp',
  'processos-rpa',
  'dados-pipelines',
  'previsao-ml',
  'dashboards',
  'conteudo',
  'leads',
  'estrategia',
] as const;

export type CapId = (typeof CAP_IDS)[number];

/** Número de capacidades do catálogo. */
export const CAP_COUNT: number = CAP_IDS.length;
