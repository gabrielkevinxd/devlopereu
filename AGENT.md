# Agente com IA real (LLM + voz)

O agente do site conversa livremente, qualifica o visitante e **controla o palco** através de
*tool calls*: preenche a ficha da empresa, desenha a simulação para o caso concreto, destaca as
capacidades certas e pré-preenche o agendamento (que o visitante confirma e envia por WhatsApp/email).
Responde por voz quando o visitante fala ou pede. Sem chave, o site continua com o fluxo guiado.

## Arquitetura (e porquê)

```
browser ──POST /api/agent.php──►  produção: public/api/agent.php  (PHP ≥ 7.4 + cURL, Apache/hosting partilhado)
   ▲  NDJSON em streaming          dev/preview: server/agent/*.ts  (middleware do Vite, mesmo URL e contrato)
   │                                        │
   └── tool calls → palco                   └── agent-brain.json (system prompt, tools, limites, guardas — fonte única)
                                            └── provider: gemini | openai | anthropic | mock
```

- O site é publicado como ficheiros estáticos num Apache (`.htaccess`, upload de `dist/`). Num
  alojamento partilhado **não há Node**, mas há sempre PHP + cURL → `api/agent.php` é o endpoint mais
  simples que funciona lá, sem servidores extra. Em `npm run dev`/`preview` o mesmo URL é servido por
  um middleware Vite em TypeScript com o **mesmo contrato**, lendo o **mesmo** `agent-brain.json`.
- A chave só existe no servidor (variável de ambiente ou ficheiro `.env` fora do `public_html`); o
  bundle do browser não contém chaves nem URLs de providers (verificado por `grep` no `dist/assets`).
- Streaming: o servidor emite NDJSON (`{t:"text"}`, `{t:"tool"}`, `{t:"done"}`, `{t:"fallback"}`).
  Com Gemini o texto chega palavra a palavra (SSE do provider reencaminhado). Se o alojamento fizer
  buffering, a resposta chega de uma vez — continua a funcionar.

## Ativar (dono)

1. Criar uma chave **Gemini** (recomendado, barato): <https://aistudio.google.com/apikey>.
   Ativar faturação no projeto (o nível gratuito pode usar os dados para melhorar produtos da Google —
   não recomendado para dados de clientes) e definir um alerta/limite de orçamento.
2. No servidor, criar o ficheiro **`devloper-agent.env`** UMA pasta acima de `public_html`
   (ex.: `/home/utilizador/devloper-agent.env`), com:
   ```
   AGENT_PROVIDER=gemini
   GEMINI_API_KEY=cole-aqui-a-chave
   AGENT_MODEL=gemini-2.5-flash
   AGENT_BUDGET_EUR=5
   AGENT_ADMIN_TOKEN=uma-frase-longa-e-aleatoria-com-24-ou-mais-caracteres
   ```
   Recomenda-se fixar `gemini-2.5-flash`: é o mais barato com boa qualidade e responde sem «thinking»
   (≈ 4 s). Aliases como `gemini-flash-latest` mudam de modelo sem aviso e são faturados pelo preço
   mais caro da tabela.
   Alternativas: variáveis de ambiente no painel do alojamento, ou `public_html/api/.env`
   (bloqueado pelo `api/.htaccess`). Modelo de exemplo: [`.env.example`](.env.example).
3. Fazer upload do `dist/` como sempre (inclui `api/agent.php`, `api/agent-brain.json`, `api/.htaccess`).
4. Testar: abrir `https://devloper.eu/api/agent.php?action=health` → `{"llm":true,...}`.

Trocar de provider: `AGENT_PROVIDER=openai` + `OPENAI_API_KEY=…` (ou `anthropic` + `ANTHROPIC_API_KEY`).
Modelo: `AGENT_MODEL=…`. Desligar tudo: `AGENT_DISABLED=1`.
Em desenvolvimento: `.env` na raiz do projeto (ignorado pelo git) ou `AGENT_PROVIDER=mock npm run dev`.

## Orçamento: máximo absoluto de 5 € por mês (em euros, não em pedidos)

**Regra:** o agente nunca gasta mais do que `AGENT_BUDGET_EUR` (5 €) por período
(`AGENT_BUDGET_PERIOD=month`, mês civil de Lisboa; também `week` ou `day`). Não existe teto por
número de pedidos — o antigo `AGENT_DAILY_CAP=3000` foi removido.

### Preços usados (USD por 1 milhão de tokens)
Fonte oficial: <https://ai.google.dev/gemini-api/docs/pricing> (plano pago/Standard, consultado a 27-09-2026).
Configuráveis em `public/api/agent-brain.json → pricing`.

| Modelo | Entrada | Saída |
|---|---|---|
| `gemini-2.5-flash` (predefinição) | 0,30 texto · 1,00 áudio | 2,50 (inclui tokens de raciocínio) |
| `gemini-2.5-flash-preview-tts` | 0,50 texto | 10,00 áudio |
| `gemini-2.5-flash-lite` | 0,10 texto · 0,30 áudio | 0,40 |
| `gemini-3.8-flash` / alias `gemini-flash-latest` | 1,50 | 7,50 (preço de 2027, conservador; até 31-12-2026 é 0,75 / 3,75) |
| modelo desconhecido | 3,00 | 15,00 (muito conservador) |

Conversão: **1 USD = 1 EUR** (o dólar vale menos que o euro, logo sobrestima o custo) e
**margem de segurança de 20 %** sobre todos os custos. OpenAI/Anthropic estão na tabela como referência
(confirmar nas páginas oficiais se forem usados).

### Como se garante que nunca passa dos 5 €
1. **Antes** de cada chamada (cada ronda de chat, cada voz, cada transcrição) calcula-se o custo do
   **pior caso**: entrada = caracteres ÷ 2 (+200) tokens — o texto real anda nos 4 caracteres/token —
   e saída = o máximo de tokens permitido (+2048 de raciocínio nos modelos que pensam).
2. Esse valor é **reservado** no ledger (`ledger-AAAA-MM.json`, escrito com `flock`) e a chamada só
   avança se `gasto + reservas + pior caso ≤ 98 % do orçamento` (4,90 €).
3. **Depois**, a reserva é trocada pelo custo **real**, calculado com o `usage` devolvido pelo provider
   (tokens de entrada, saída e raciocínio, áudio). Erros HTTP não são faturados; se a rede cair a meio,
   cobra-se o pior caso.
4. Quando já não cabe o pior caso da próxima chamada (≈ 0,005 €), o site passa ao **fluxo guiado**
   até ao próximo período. Testado: com um orçamento de 0,01 €, as chamadas pararam nos 0,006 €, e
   nenhuma passou depois disso.

### Patamares do orçamento global

| Gasto | Patamar | Comportamento |
|---|---|---|
| < 70 % (< 3,50 €) | normal | tudo ativo |
| 70–90 % (3,50–4,50 €) | economia | sem TTS do provider (usa a voz grátis do browser); respostas curtas (máx. 250 tokens, ≤ 35 palavras) |
| 90–100 % (4,50–4,90 €) | reserva | só começam conversas com IA os visitantes que já fizeram o diagnóstico guiado (setor + dor + equipa); os restantes ficam no fluxo guiado; as conversas em curso continuam |
| ≥ 4,90 € ou sem margem para o pior caso | esgotado | só fluxo guiado (sem LLM) até ao próximo período |

### Limite por conversa e «check match»
- **Limite por conversa** = orçamento ÷ conversas-alvo = **5 € ÷ 200 = 0,025 €**, e no máximo
  **10 respostas** do LLM (`AGENT_TARGET_CONVERSATIONS`, `AGENT_MAX_TURNS`). Cada cliente é um hash
  anónimo de (sal secreto + IP + id de sessão).
- No máximo **2 respostas com voz do provider** por cliente; depois usa a voz do browser (grátis).
- Aos **75 %** do limite (em euros ou em respostas, o que chegar primeiro; com 10 respostas, na
  8.ª) entra o **CHECK MATCH**. O agente resume o caso numa frase e avalia 4 critérios explícitos:
  1. **empresa real** — há um negócio identificado;
  2. **dor concreta** — há um processo ou uma perda de tempo descrita;
  3. **processo automatizável** — repetitivo, digital ou baseado em regras;
  4. **poder de decisão e timing** — decide ou influencia, e quer agir nos próximos meses.
- **Qualificado** (os 4 verdadeiros; a regra é aplicada pelo servidor, não pelo modelo) → pergunta de
  fecho e agendamento **pré-preenchido** com o 1.º dia útil às 10:30.
- **Não qualificado** → agradece, deixa a checklist gratuita e os contactos, e **termina** a conversa
  com o LLM (o palco mostra «Obrigado pela conversa»).
- Ao atingir 100 % do limite → a conversa passa ao agendamento guiado, sem erro.
- Resultado registado sem dados pessoais: qualificado / desqualificado (e qual critério falhou) /
  sem resposta (check match sem desfecho há mais de 30 min).

### Quanto custa na prática (medido)

| Medição | Custo (com a margem de 20 %) |
|---|---|
| Chamada real ao `gemini-2.5-flash` (27-09-2026) | 4 432 tokens de entrada + 184 de saída = **0,00215 €** num turno (2 rondas) |
| Provider mock com preços do 2.5 Flash | **0,0044 €** por conversa de 4 turnos |
| Resposta falada (≈ 15 s de áudio TTS) | ≈ 0,0045 € |

Conversas que cabem nos 5 € (em 4,90 €):

| Cenário | Custo por conversa | Conversas |
|---|---|---|
| Todas usam o limite completo | 0,025 € | 196 |
| Típico medido: 4–5 turnos | ≈ 0,009–0,011 € | ≈ 450–550 |

O painel calcula esta estimativa em tempo real, a partir da média do mês.

### Painel do dono
`https://devloper.eu/api/admin.html` → colar o `AGENT_ADMIN_TOKEN` (definido no `devloper-agent.env`,
com pelo menos 24 caracteres aleatórios). Mostra:
- gasto do período e % do orçamento, com o patamar atual;
- conversas e custo médio por conversa;
- quantas conversas ainda cabem;
- qualificados, desqualificados (por critério), sem resposta e pedidos de reunião;
- gasto por dia.

Só agregados — nada de IP, nomes, contactos ou mensagens. Também se pode consultar em JSON:
`curl -H "Authorization: Bearer TOKEN" https://devloper.eu/api/agent.php?action=admin`.

### Reiniciar clientes (para voltar a testar o agente)
No painel, secção **Reiniciar clientes**:
- **Reiniciar o meu acesso**: apaga só os registos de conversa do IP de quem carrega no botão e limpa
  o limite de pedidos (rate limit) desse IP. Os outros visitantes não são afetados.
- **Reiniciar todos os clientes**: pede confirmação e depois apaga os registos de toda a gente e todos
  os rate limits. É útil em testes.

O painel mostra o resultado («3 clientes reiniciados») e os últimos 5 reinícios. Depois, abra o site num
separador novo para começar uma conversa limpa. O check match volta a acontecer só ao fim de um novo
limite de turnos.

- **Não mexe:** gasto do mês (`spentEur`), chamadas, gasto por dia e reservas. O teto de 5 €/mês
  continua a contar. Os totais das conversas apagadas são arquivados, por isso as estatísticas do
  painel não se perdem.
- **Sem PII:** cada registo de cliente guarda `ip` = hash(sal secreto | IP), 24 hex, e nunca o IP em
  claro. O registo da ação (`adminLog` no ledger) guarda só quando, âmbito, quantos clientes e quantos
  rate limits foram limpos.
- **Segurança:** só `POST`, com o token, e sem token responde 401. A ação tem o seu próprio limite
  (10 por 10 min, depois 429). Não passa pelo rate limit do chat, por isso o dono consegue
  desbloquear-se.
- **Registos antigos:** os que são anteriores a esta versão não têm hash de IP e só saem com
  «todos».

```bash
curl -X POST -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"admin_reset","scope":"mine"}' https://devloper.eu/api/agent.php
# → {"ok":true,"scope":"mine","clients":1,"rateLimits":1}      (scope "all" = todos)
```
Mesmo contrato no PHP (produção) e no middleware Vite (dev/preview). O teste é
`PHP=<php.exe> node .verify/v6/reset-test.cjs`, com os dois backends e dois IPs reais.

### Onde fica o ledger
`AGENT_DATA_DIR`, ou por omissão `devloper-agent-data/` UMA pasta acima do `public_html` (ou
`api/data/`, bloqueada pelo `.htaccess`). Sem pasta gravável o LLM fica desligado — sem controlo de
custos não há IA.

## Segurança, RGPD e robustez

- Aviso RGPD no chat antes da primeira mensagem ir para o LLM («Aceitar» / «Prefiro as opções
  guiadas»); a Política de Privacidade (6 idiomas) descreve este tratamento.
- Filtro de prompt-injection (PT/EN/FR/ES/DE/SV) responde sem chamar o modelo e volta ao tema; o
  system prompt proíbe inventar preços, clientes, números ou prazos e trata o texto do visitante como dados.
- CORS: só `https://devloper.eu`/`www` (+ `AGENT_ALLOWED_ORIGINS`) e pedidos do próprio domínio.
- Logs: só ação, provider, estado e duração — nunca conteúdo, IP ou dados pessoais. O rate limit
  guarda apenas um hash do IP e carimbos de tempo.
- Sem chave, provider em baixo, timeout, rate limit ou rede falhada → fluxo guiado, sem erro visível.
- Voz: microfone via Web Speech API (no browser); sem ela, grava e transcreve no servidor (Gemini/OpenAI).
  Resposta falada com TTS do provider; sem ele, `speechSynthesis` com voz do idioma (pt-PT). Só fala
  depois de interação do visitante; texto sempre visível; botão de silenciar.
