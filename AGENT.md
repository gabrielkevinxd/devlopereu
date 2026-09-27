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
   ```
   Alternativas: variáveis de ambiente no painel do alojamento, ou `public_html/api/.env`
   (bloqueado pelo `api/.htaccess`). Modelo de exemplo: [`.env.example`](.env.example).
3. Fazer upload do `dist/` como sempre (inclui `api/agent.php`, `api/agent-brain.json`, `api/.htaccess`).
4. Testar: abrir `https://devloper.eu/api/agent.php?action=health` → `{"llm":true,...}`.

Trocar de provider: `AGENT_PROVIDER=openai` + `OPENAI_API_KEY=…` (ou `anthropic` + `ANTHROPIC_API_KEY`).
Modelo: `AGENT_MODEL=…`. Desligar tudo: `AGENT_DISABLED=1`.
Em desenvolvimento: `.env` na raiz do projeto (ignorado pelo git) ou `AGENT_PROVIDER=mock npm run dev`.

## Custo estimado (preços públicos de referência — confirmar na página de preços do provider)

| Provider (predefinição) | Conversa típica (8 turnos, só texto) | + voz em todas as respostas |
|---|---|---|
| Gemini 2.5 Flash (+ TTS 2.5 Flash) | ≈ 0,01 € | ≈ +0,03 € |
| OpenAI gpt-4.1-mini (+ gpt-4o-mini-tts) | ≈ 0,01–0,02 € | ≈ +0,03 € |
| Anthropic Claude Haiku 4.5 (voz do browser) | ≈ 0,03–0,04 € | 0 € (speechSynthesis) |

Pressupostos: ~3 000 tokens de entrada por turno (prompt + ferramentas + histórico curto) e ~300 de
saída; voz ≈ 15 s por resposta. Limites que travam custos: 600 caracteres por mensagem, 12 mensagens
de histórico, 600 tokens de saída, 30 pedidos/10 min e 200/dia por IP, **3 000 pedidos/dia no total**
(`AGENT_DAILY_CAP`), timeout 25 s.

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
