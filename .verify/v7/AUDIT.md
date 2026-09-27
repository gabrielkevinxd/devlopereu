# Auditoria de design — DevloperEU (redesign-v2, 27/09/2026)

Base: build de produção de `952f20e`, servido localmente, visto a 1440×900 e 390×844 (modo clássico
«Navegar» e modo agente). Screenshots «antes» em `.verify/v7/shots/antes/` (`<largura>-<tema>-<modo>-…`).
A identidade mantém-se: logótipo real, preto + dourado, «o site é o agente», Mega Brain e funil para
agendar. Abaixo, os 10 problemas que mais pesam, do mais visível para o menos, cada um com a correção
aplicada.

---

## 1. Grelhas com buracos cinzentos («O que fazemos» e «Como trabalhamos»)
**Problema.** As duas grelhas usam o truque «1 px de gap sobre fundo cor de linha». Quando o número de
itens não enche a última linha, as células que faltam aparecem a cinzento:
- «O que fazemos» tem 6 cartões em 4 colunas, o que deixa 2 buracos a 1440 (o caso reportado pelo dono);
- «Como trabalhamos» tem 4 passos em 3 colunas, o que deixa 2 buracos por volta de 1024 px.

Dá a sensação de que falta conteúdo. Medido no build antigo: «O que fazemos» tem **600 px vazios** a 1440 e
«Como trabalhamos» tem **645 px vazios** a 1024.
`antes/1440-light-classico-03-c-services`, `antes/1024-light-processo-buracos`

**Correção.**
- **O que fazemos:** a secção passa a ser gerada a partir do catálogo único (15 capacidades em 5
  grupos). Cada grupo é um cartão, em `flex-wrap` com `flex-grow`, por isso a última linha estica sempre
  e nunca há células vazias, seja qual for o nº de grupos ou itens.
- **Como trabalhamos:** passa a uma linha temporal com tantas colunas quantos os passos
  (`repeat(var(--n))`) em desktop; em tablet e telemóvel vira lista vertical.
- **Fundo:** acaba o fundo cinzento por baixo das grelhas.
- **Teste:** `.verify/v7/grid-test.cjs` verifica que não há espaço vazio a 360/768/1024/1440/1920.

## 2. Conteúdo desatualizado e contagens escritas à mão
**Problema.**
- «Seis capacidades» no modo clássico, enquanto o Mega Brain mostra 15. Há dois catálogos diferentes
  (`t.services`, com 6 serviços antigos, e `capabilities.ts`, com 15).
- «Trabalhamos em seis idiomas» e «12 tarefas» (em 4 textos) estão escritos à mão nos 6 idiomas; ficam
  errados à primeira mudança.

**Correção.**
- **Uma só fonte:** o modo clássico lista o catálogo (`CAPABILITIES`/`GROUPS`), com a frase «{n}
  capacidades em {g} áreas».
- **Números derivados:** idiomas = `LANGS.length`; tarefas = `magnet.items.length`. Os textos usam
  `{n}` nos 6 idiomas.

## 3. Hero do modo clássico: o logótipo parece um ícone colado e o conceito desaparece
**Problema.**
- A coluna direita é um quadrado preto com o logótipo e sombra, que parece um ícone de app pousado no
  papel. Não diz nada sobre «o site é o agente»: quem chega pelo Google ao modo clássico não percebe
  que há um agente para experimentar.
- O H1 parte em 4 linhas a 1440.
- No telemóvel, o quadrado ocupa ~260 px depois dos CTAs e empurra o conteúdo.

`antes/1440-light-classico-01-topo.png`, `antes/390-light-classico-01-topo.png`

**Correção.**
- **Pré-visualização do agente:** a coluna direita mostra um cartão escuro (o mesmo material do palco)
  com o símbolo real, «Agente DevloperEU · online», a mensagem de abertura REAL do agente (i18n) e o
  botão «Conversar com o agente». É a ponte entre os dois modos.
- **H1** mais largo (3 linhas a 1440).
- **Telemóvel:** o cartão fica compacto, abaixo dos CTAs, sem o quadrado de 260 px.

## 4. Ritmo vertical monótono e hierarquia fraca entre secções
**Problema.** Todas as secções têm o mesmo padding, a mesma régua e o mesmo `h2` alinhado à esquerda,
sem mais nada. Numa página longa em papel marfim, nada distingue as secções nem indica onde se está.
`antes/1440-light-classico-00-pagina.png`

**Correção.**
- **Cabeçalho de secção em 2 colunas** em desktop: eyebrow numerada (`01 · Capacidades`) + título à
  esquerda, frase de apoio à direita.
- **Faixa de contraste:** «Como trabalhamos» passa a uma faixa de fundo alternado (`--paper-2`), que dá
  respiração e marca a meio da página.
- **Menos réguas:** ficam só entre blocos de natureza diferente.

## 5. Espaço vazio mal distribuído («Sobre» e FAQ)
**Problema.**
- **Sobre:** o texto ocupa ~45 % da largura e deixa metade do ecrã vazia a 1440.
- **FAQ:** as perguntas esticam a 1200 px, com o «+» a mais de 1000 px da pergunta; o olho faz
  ping-pong.

`antes/1440-light-classico-05-c-about.png`, `antes/1440-light-classico-06-c-faq.png`

**Correção.**
- **Sobre em 2 colunas:** o texto à esquerda e, à direita, factos verificáveis, todos derivados e nada
  inventado: fundada em 2024 (`CONTACT.foundingYear`), Braga, n.º de idiomas, n.º de capacidades,
  RGPD e AI Act.
- **FAQ em 2 colunas:** à esquerda, o título + «Não encontra a resposta? Pergunte ao agente» (fica
  fixo em desktop); à direita, as perguntas numa largura de leitura (~46 rem).

## 6. Header e rodapé pesados e desligados do contexto
**Problema.**
- **Header:** é uma faixa preta fixa por cima de uma página marfim, com um corte duro. Mostra «agente
  online» mesmo no modo clássico e não tem controlo de tema.
- **Rodapé no telemóvel:** ocupa ~1/6 da página. As colunas de links são altas e a lista de 6 idiomas
  repete o seletor do topo.

`antes/1440-light-classico-01-topo.png`, `antes/390-light-classico-99-rodape.png`

**Correção.**
- **Header no modo clássico** segue o tema:
  - claro: marfim translúcido com desfoque, régua fina e o logótipo real dourado, que é a versão da
    marca em fundo claro (a fonte original do logótipo é dourada sobre branco);
  - escuro: preto.
- **Alternador sol/lua** no header. O estado «agente online» só aparece no modo agente.
- **Rodapé no telemóvel:** colunas em 2×2 compactas e idiomas numa linha que quebra.

## 7. Sem modo escuro, e a passagem agente ↔ clássico é um salto de preto para marfim
**Problema.** O modo clássico é só claro. Quem tem o sistema em escuro, ou vem do agente (preto),
recebe uma página marfim de repente.

**Correção.**
- **Tema escuro completo no modo clássico.** Por omissão segue o sistema (`prefers-color-scheme`); a
  escolha fica guardada (`localStorage`, com try/catch).
- **Sem flash:** script inline no `<head>` antes da pintura, também nas páginas pré-renderizadas.
- **Tokens:** em `:root` / `[data-theme=dark]`, com contraste AA verificado nos dois temas.
- **`theme-color`** acompanha o tema.
- **Painel admin** respeita o tema do sistema.
- **Modo agente:** fica sempre escuro (ver a decisão no fim).

## 8. Agendamento: chips de dia irregulares
**Problema.** «Segunda, 28/09» parte em 2 linhas e «Quinta, 1/10» cabe numa, por isso a grelha de
dias tem alturas e alinhamentos diferentes. É o ecrã de conversão, e é onde mais se nota.
`antes/1440-light-agente-04-agendar.png`, `antes/1440-light-classico-07-agendar.png`

**Correção.** Cada chip passa a 2 linhas fixas: dia da semana abreviado (`seg.`) e data (`28/09`),
com `Intl` nos 6 idiomas. Todos têm a mesma altura e formam uma grelha regular.

## 9. Modo agente no telemóvel: a primeira mensagem fica cortada
**Problema.** No 1.º ecrã (390×844), o palco de arranque ocupa ~50 % da altura, e a mensagem de
boas-vindas do agente fica escondida por baixo dos botões de resposta («…faria na sua» e o resto
cortado). É a primeira impressão do site.
`antes/390-light-agente-01-inicio.png`

**Correção.** Na fase de arranque, o palco no telemóvel fica compacto (logótipo + linhas de arranque
lado a lado, ~26 svh). A mensagem completa e as respostas cabem no 1.º ecrã. Nas fases seguintes
(simulação, Mega Brain) o palco volta a crescer.

## 10. Modo agente em desktop: palco meio vazio na simulação
**Problema.** Na simulação, o conteúdo acaba a ~60 % da altura do palco e fica um bloco pontilhado
vazio por baixo; parece inacabado.
`antes/1440-light-agente-02-simulacao.png`

**Correção.** O conteúdo do palco fica centrado na vertical quando é mais curto do que o palco
(margens `auto`). Quando é mais longo (Mega Brain, agendamento), continua a começar em cima e a fazer
scroll, sem cortes.

---

## Decisão: tema no modo agente
**O modo agente e o Mega Brain ficam sempre escuros.** Razões:
- **Palco:** o palco é um «centro de comando» (grelha pontilhada, brilhos dourados, núcleo com
  `mask` do logótipo, pacotes animados nas linhas). Tudo isso depende de fundo escuro; numa versão
  clara, os brilhos viram manchas e o dourado perde contraste.
- **Identidade:** é a parte mais identitária do site (preto + dourado, «o site é o agente»).

**Na prática:**
- **Header no modo agente:** o alternador fica escondido, porque um botão que não muda nada seria
  confuso. Aparece no modo clássico e nas páginas de conteúdo (legais, checklist), onde tem efeito.
- **Escolha guardada:** a escolha fica guardada e aplica-se sempre que se volta ao modo clássico.

---

## Resultado (depois)

Imagens antes/depois de todas as secções do modo clássico e dos 4 estados do modo agente, a 390 e 1440,
nos temas claro e escuro, em `.verify/v7/galeria/{antes,depois}/` (WebP). Os PNG originais ficam em
`.verify/v7/shots/`, fora do git. Os «antes» em `dark` mostram o que um visitante com o sistema em escuro
via: o mesmo modo clássico marfim, porque não havia tema escuro.

| # | Problema | Correção aplicada | Prova |
|---|---|---|---|
| 1 | Buracos cinzentos nas grelhas | Grupos do catálogo em flex com `flex-grow`; passos em `repeat(n)` | `grid-test.cjs` 41/41 (360→1920, 1…9 itens/grupo, controlo negativo apanha a grelha antiga) |
| 2 | «Seis», «seis idiomas» e «12» escritos à mão | Catálogo único; `{caps}` `{langs}` `{tasks}` resolvidos ao carregar o dicionário | `flow-test.cjs` (6 idiomas no HTML pré-renderizado) |
| 3 | Hero com logótipo colado, sem o agente | Pré-visualização do agente (abertura real + CTA); H1 em 3 linhas | `galeria/depois/*-classico-01-topo` |
| 4 | Ritmo monótono | Cabeçalhos numerados em 2 colunas; faixa alternada em «Como trabalhamos» | `*-classico-00-pagina` |
| 5 | Espaço vazio (Sobre, FAQ) | Sobre + factos derivados; FAQ em 2 colunas com «Pergunte ao agente» | `*-c-about`, `*-c-faq` |
| 6 | Header preto sobre marfim, rodapé longo | Header segue o tema (logótipo dourado-escuro no claro); idiomas numa linha | `*-classico-01-topo`, `*-99-rodape` |
| 7 | Sem tema escuro | Tema claro/escuro; sistema por omissão; sem flash; AA | `theme-test.cjs` 25/25 (axe 0 violações nos 2 temas) |
| 8 | Chips de dia irregulares | Dia abreviado + data em 2 linhas fixas | `*-agente-04-agendar`, `*-agendar` |
| 9 | Boas-vindas cortada no telemóvel | Palco de arranque compacto no 1.º ecrã | `390-*-agente-01-inicio` |
| 10 | Palco meio vazio | Conteúdo curto centrado na vertical | `1440-*-agente-02-simulacao` |

**Extra:**
- **Deep link `?cap=<id>`:** «Ver o fluxo no agente» abre o Mega Brain na capacidade escolhida, e o link
  é partilhável.
- **Catálogo e SEO:** o catálogo (6 idiomas) passou para um chunk próprio, com `modulepreload` do
  dicionário e do catálogo no HTML. O JSON-LD de serviços passou a vir do catálogo (15).

### Lighthouse (`vite preview`, as mesmas condições da v5; antes = build `952f20e` medido na mesma sessão, intercalado)
| | Antes | Depois |
|---|---|---|
| Mobile, modo agente (4 corridas) | 83 · 84 · 85 · 89 | **93 · 95 · 94 · 95** |
| Mobile, modo clássico | 82 · 84 (a11y **96**) | claro 89 · 88 / escuro 90 · 89 (a11y **100**) |
| Desktop | 100 | 100 |
| Acessibilidade / Boas práticas / SEO | 100 / 100 / 100 (clássico: a11y 96) | 100 / 100 / 100 em todos |

A acessibilidade do modo clássico estava a 96 por contraste: o dourado sobre marfim no formulário estava a
1,84:1 e os números da checklist a 3,96:1. O axe apanhou os dois e ambos estão corrigidos com o token
`--accent`.
