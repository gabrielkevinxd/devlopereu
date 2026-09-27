<?php
/**
 * DevloperEU — endpoint do agente (produção: Apache/hosting partilhado, PHP >= 7.4 com cURL).
 * Mesmo contrato do middleware de dev (server/agent/handler.ts); cérebro em agent-brain.json.
 *
 *   GET  ?action=health                                  → {"llm":bool,"provider":..,"tts":bool,"stt":bool}
 *   POST {"action":"chat","lang","messages","state","voice"} → NDJSON {t:text|tool|fallback|done}
 *   POST {"action":"tts","lang","text"}                  → áudio (wav/mp3)
 *   POST {"action":"stt","mime","audio"(base64)}         → {"text":..}
 *
 * Configuração (nunca no browser): variáveis de ambiente do alojamento, OU ficheiro
 * `devloper-agent.env` uma pasta acima de public_html, OU `api/.env` (bloqueado pelo .htaccess).
 */
declare(strict_types=1);

const KEY_VARS = ['gemini' => 'GEMINI_API_KEY', 'openai' => 'OPENAI_API_KEY', 'anthropic' => 'ANTHROPIC_API_KEY'];
const LANGS = ['pt', 'en', 'fr', 'es', 'de', 'sv'];

$brain = json_decode((string) file_get_contents(__DIR__ . '/agent-brain.json'), true);
$L = $brain['limits'];
$env = load_env();

/* ─────────────────────────── CORS / método ─────────────────────────── */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$extra = array_filter(array_map('trim', explode(',', (string) ($env['AGENT_ALLOWED_ORIGINS'] ?? ''))));
if ($origin !== '') {
    // Same-origin (Origin = Host deste pedido) é sempre permitido; outras origens só as da lista.
    $sameOrigin = (parse_url($origin, PHP_URL_HOST) . (parse_url($origin, PHP_URL_PORT) ? ':' . parse_url($origin, PHP_URL_PORT) : '')) === ($_SERVER['HTTP_HOST'] ?? '');
    if (!$sameOrigin && !in_array($origin, array_merge($brain['allowedOrigins'], $extra), true)) {
        respond_json(403, ['error' => 'origin']);
    }
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('X-Content-Type-Options: nosniff');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}

$cfg = resolve_config($env, $brain);
$ttsOk = $cfg && in_array($cfg['provider'], ['gemini', 'openai', 'mock'], true) && ($env['AGENT_TTS'] ?? 'on') !== 'off';
$sttOk = $cfg && in_array($cfg['provider'], ['gemini', 'openai', 'mock'], true);

if ($method === 'GET') {
    respond_json(200, ['llm' => (bool) $cfg, 'provider' => $cfg ? $cfg['provider'] : null, 'tts' => $ttsOk, 'stt' => $sttOk]);
}
if ($method !== 'POST') {
    respond_json(405, ['error' => 'method']);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $L['maxBodyBytes']) {
    respond_json(413, ['error' => 'too_large']);
}
$body = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($body)) {
    respond_json(400, ['error' => 'body']);
}
$action = (string) ($body['action'] ?? 'chat');
$lang = in_array($body['lang'] ?? '', LANGS, true) ? $body['lang'] : 'pt';
$t0 = microtime(true);

if (!$cfg) {
    agent_log($action, 'none', 'unavailable', $t0);
    if ($action === 'chat') {
        stream_start();
        emit(['t' => 'fallback', 'reason' => 'unavailable']);
        exit;
    }
    respond_json(503, ['error' => 'unavailable']);
}
if (!rate_limit($L, (int) ($env['AGENT_DAILY_CAP'] ?? 0) ?: $L['maxGlobalPerDay'])) {
    agent_log($action, $cfg['provider'], 'rate_limited', $t0);
    if ($action === 'chat') {
        stream_start();
        emit(['t' => 'fallback', 'reason' => 'busy']);
        exit;
    }
    respond_json(429, ['error' => 'busy']);
}

try {
    if ($action === 'tts') {
        if (!$ttsOk) respond_json(501, ['error' => 'tts']);
        $text = trim(mb_substr((string) ($body['text'] ?? ''), 0, $L['ttsMaxChars']));
        if ($text === '') respond_json(400, ['error' => 'text']);
        [$mime, $audio] = do_tts($cfg, $text, $lang);
        header('Content-Type: ' . $mime);
        header('Cache-Control: no-store');
        echo $audio;
        agent_log('tts', $cfg['provider'], 'ok', $t0);
        exit;
    }
    if ($action === 'stt') {
        if (!$sttOk) respond_json(501, ['error' => 'stt']);
        $audio = base64_decode((string) ($body['audio'] ?? ''), true);
        if (!$audio || strlen($audio) > $L['sttMaxBytes']) respond_json(400, ['error' => 'audio']);
        $mime = preg_match('~^audio/[\w.+-]+~', (string) ($body['mime'] ?? ''), $m) ? $m[0] : 'audio/webm';
        $text = mb_substr(do_stt($cfg, $audio, $mime), 0, $L['maxMessageChars']);
        agent_log('stt', $cfg['provider'], 'ok', $t0);
        respond_json(200, ['text' => $text]);
    }

    // chat
    $history = normalize_history($body['messages'] ?? null, $L);
    if (!$history) respond_json(400, ['error' => 'messages']);
    if (($body['voice'] ?? false) === true) $history[count($history) - 1]['text'] .= "\n[The visitor is using voice.]";
    stream_start();
    $last = $history[count($history) - 1]['text'];
    foreach ($brain['guard']['patterns'] as $p) {
        if (preg_match('~' . $p . '~iu', $last)) {
            emit(['t' => 'text', 'd' => $brain['guard']['redirect'][$lang] ?? $brain['guard']['redirect']['en']]);
            emit(['t' => 'done', 'provider' => 'guard']);
            agent_log('chat', $cfg['provider'], 'guard', $t0);
            exit;
        }
    }
    try {
        $system = build_system($brain, $lang, $body['state'] ?? new stdClass());
        $fn = 'chat_' . $cfg['provider'];
        $fn($cfg, $system, $history, $brain['tools']);
        emit(['t' => 'done', 'provider' => $cfg['provider']]);
        agent_log('chat', $cfg['provider'], 'ok', $t0);
    } catch (Throwable $e) {
        emit(['t' => 'fallback', 'reason' => 'provider']);
        agent_log('chat', $cfg['provider'], 'error:' . $e->getCode(), $t0);
    }
    exit;
} catch (Throwable $e) {
    agent_log($action, $cfg['provider'], 'error:' . $e->getCode(), $t0);
    if (!headers_sent()) respond_json(502, ['error' => 'provider']);
    exit;
}

/* ─────────────────────────── Configuração ─────────────────────────── */

function load_env(): array
{
    $env = [];
    $files = [dirname(__DIR__, 2) . '/devloper-agent.env', __DIR__ . '/.env'];
    foreach ($files as $f) {
        if (!is_readable($f)) continue;
        foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
            [$k, $v] = explode('=', $line, 2);
            $env[trim($k)] = trim(trim($v), "\"'");
        }
        break;
    }
    $names = ['AGENT_PROVIDER', 'GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'AGENT_MODEL', 'AGENT_TTS_MODEL',
        'AGENT_VOICE', 'AGENT_TTS', 'AGENT_ALLOWED_ORIGINS', 'AGENT_DISABLED', 'AGENT_DAILY_CAP'];
    foreach ($names as $n) {
        $v = getenv($n);
        if ($v !== false && $v !== '') $env[$n] = $v; // variáveis do alojamento têm prioridade
    }
    return $env;
}

function resolve_config(array $env, array $brain): ?array
{
    if (($env['AGENT_DISABLED'] ?? '0') === '1') return null;
    $provider = $env['AGENT_PROVIDER'] ?? '' ?: $brain['defaults']['provider'];
    if (!in_array($provider, ['gemini', 'openai', 'anthropic', 'mock'], true)) return null;
    $key = $provider === 'mock' ? 'mock' : trim((string) ($env[KEY_VARS[$provider]] ?? ''));
    if ($key === '') return null;
    $d = $provider === 'mock' ? ['model' => 'mock', 'tts' => 'mock', 'voice' => 'mock', 'stt' => 'mock'] : $brain['defaults'][$provider];
    return [
        'provider' => $provider,
        'key' => $key,
        'model' => ($env['AGENT_MODEL'] ?? '') ?: $d['model'],
        'ttsModel' => ($env['AGENT_TTS_MODEL'] ?? '') ?: ($d['tts'] ?? ''),
        'voice' => ($env['AGENT_VOICE'] ?? '') ?: ($d['voice'] ?? ''),
        'sttModel' => $d['stt'] ?? '',
        'timeout' => $brain['limits']['timeoutSec'],
        'maxTokens' => $brain['limits']['maxOutputTokens'],
        'maxRounds' => $brain['limits']['maxRounds'],
    ];
}

function build_system(array $brain, string $lang, $state): string
{
    $tz = new DateTimeZone('Europe/Lisbon');
    $d = new DateTime('now', $tz);
    $today = $d->format('Y-m-d');
    $slots = [];
    while (count($slots) < 10) {
        $d->modify('+1 day');
        if ((int) $d->format('N') <= 5) $slots[] = $d->format('Y-m-d') . ' (' . $d->format('D') . ')';
    }
    $stateJson = mb_substr((string) json_encode($state, JSON_UNESCAPED_UNICODE), 0, 1500);
    return strtr($brain['system'], [
        '{lang}' => $lang, '{today}' => $today, '{slots}' => implode(', ', $slots),
        '{times}' => implode(', ', $brain['times']), '{state}' => $stateJson,
    ]);
}

/* ─────────────────────────── Proteções ─────────────────────────── */

function clean_text(string $s): string
{
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    return trim(preg_replace('/\s{3,}/u', '  ', $s) ?? '');
}

/** Só texto, papéis válidos, corta tamanho/número, começa em «user» e alterna papéis. */
function normalize_history($raw, array $L): ?array
{
    if (!is_array($raw)) return null;
    $msgs = [];
    foreach ($raw as $m) {
        if (!is_array($m) || !is_string($m['text'] ?? null)) continue;
        $t = mb_substr(clean_text($m['text']), 0, $L['maxMessageChars'] * 2);
        if ($t === '') continue;
        $msgs[] = ['role' => ($m['role'] ?? '') === 'user' ? 'user' : 'assistant', 'text' => $t];
    }
    $msgs = array_slice($msgs, -$L['maxHistory']);
    $total = fn(array $a): int => array_sum(array_map(fn($m) => mb_strlen($m['text']), $a));
    while (count($msgs) > 1 && $total($msgs) > $L['maxHistoryChars']) array_shift($msgs);
    while ($msgs && $msgs[0]['role'] !== 'user') array_shift($msgs);
    $out = [];
    foreach ($msgs as $m) {
        $n = count($out);
        if ($n && $out[$n - 1]['role'] === $m['role']) $out[$n - 1]['text'] .= "\n" . $m['text'];
        else $out[] = $m;
    }
    if (!$out || $out[count($out) - 1]['role'] !== 'user') return null;
    $out[count($out) - 1]['text'] = mb_substr($out[count($out) - 1]['text'], 0, $L['maxMessageChars']);
    return $out;
}

/** Janela deslizante + teto diário por hash do IP (nunca o IP em claro) + teto diário global (custos). */
function rate_limit(array $L, int $globalCap): bool
{
    $dir = sys_get_temp_dir() . '/devloper-agent-rl';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    if (!global_cap($dir, $globalCap)) return false;
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = $dir . '/' . substr(hash('sha256', 'devloper-agent:' . $ip . ':' . __FILE__), 0, 24) . '.json';
    $now = time();
    $day = gmdate('Y-m-d');
    $fh = @fopen($file, 'c+');
    if (!$fh) return true; // sem disco temporário: não bloquear o visitante
    flock($fh, LOCK_EX);
    $b = json_decode((string) stream_get_contents($fh), true) ?: ['hits' => [], 'day' => $day, 'dayCount' => 0];
    if ($b['day'] !== $day) $b = ['hits' => [], 'day' => $day, 'dayCount' => 0];
    $b['hits'] = array_values(array_filter($b['hits'], fn($t) => $now - $t < $L['windowSec']));
    $ok = count($b['hits']) < $L['maxPerWindow'] && $b['dayCount'] < $L['maxPerDay'];
    if ($ok) {
        $b['hits'][] = $now;
        $b['dayCount']++;
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, (string) json_encode($b));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

function global_cap(string $dir, int $cap): bool
{
    $fh = @fopen($dir . '/global-' . gmdate('Y-m-d') . '.cnt', 'c+');
    if (!$fh) return true;
    flock($fh, LOCK_EX);
    $n = (int) stream_get_contents($fh);
    $ok = $n < $cap;
    if ($ok) {
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, (string) ($n + 1));
    }
    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

/** Log sem conteúdo nem dados pessoais. */
function agent_log(string $action, string $provider, string $status, float $t0): void
{
    $finish = $GLOBALS['agent_finish'] ?? '';
    error_log(sprintf('[agent] %s provider=%s status=%s ms=%d%s', $action, $provider, $status, (int) ((microtime(true) - $t0) * 1000), $finish ? " finish=$finish" : ''));
}

/* ─────────────────────────── Saída ─────────────────────────── */

function respond_json(int $status, array $data): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function stream_start(): void
{
    @ini_set('zlib.output_compression', '0');
    @ini_set('implicit_flush', '1');
    if (function_exists('apache_setenv')) @apache_setenv('no-gzip', '1');
    while (ob_get_level() > 0) @ob_end_flush();
    http_response_code(200);
    header('Content-Type: application/x-ndjson; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Accel-Buffering: no');
}

function emit(array $e): void
{
    if (isset($e['args']) && is_array($e['args']) && !$e['args']) $e['args'] = new stdClass();
    echo json_encode($e, JSON_UNESCAPED_UNICODE), "\n";
    @flush();
}

/* ─────────────────────────── HTTP ─────────────────────────── */

/** POST JSON. Com $onChunk, entrega o corpo aos bocados (streaming). Lança exceção com o status HTTP. */
function http_post(string $url, array $headers, $payload, int $timeout, ?callable $onChunk = null, bool $raw = false): string
{
    $ch = curl_init($url);
    $status = 0;
    $buf = '';
    $h = $raw ? $headers : array_merge(['Content-Type: application/json'], $headers);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => $h,
        CURLOPT_POSTFIELDS => $raw ? $payload : json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_HEADERFUNCTION => function ($c, $line) use (&$status) {
            if (preg_match('~^HTTP/\S+\s+(\d{3})~', $line, $m)) $status = (int) $m[1];
            return strlen($line);
        },
        CURLOPT_WRITEFUNCTION => function ($c, $data) use (&$buf, &$status, $onChunk) {
            if ($onChunk && $status === 200) $onChunk($data);
            else $buf .= $data;
            return strlen($data);
        },
    ]);
    curl_exec($ch);
    $err = curl_errno($ch);
    curl_close($ch);
    if ($err) throw new RuntimeException('net', 599);
    if ($status !== 200) throw new RuntimeException('http', $status ?: 599);
    return $buf;
}

/** JSON Schema com «properties» sempre objeto (o PHP descodifica {} vazio como []). */
function with_props(array $schema): array
{
    if (empty($schema['properties'])) $schema['properties'] = new stdClass();
    return $schema;
}

function decode_args($a): array
{
    if (is_array($a)) return $a;
    if (is_object($a)) return json_decode((string) json_encode($a), true) ?: [];
    $v = json_decode((string) $a, true);
    return is_array($v) ? $v : [];
}

/* ─────────────────────────── Gemini (streaming SSE) ─────────────────────────── */

function gemini_schema(array $s): array
{
    $o = ['type' => strtoupper($s['type'])];
    foreach (['description', 'enum', 'required'] as $k) if (isset($s[$k])) $o[$k] = $s[$k];
    if (isset($s['items'])) $o['items'] = gemini_schema($s['items']);
    if (!empty($s['properties'])) {
        $o['properties'] = [];
        foreach ($s['properties'] as $k => $v) $o['properties'][$k] = gemini_schema($v);
    }
    return $o;
}

function chat_gemini(array $cfg, string $system, array $history, array $tools): void
{
    $contents = array_map(fn($m) => ['role' => $m['role'] === 'user' ? 'user' : 'model', 'parts' => [['text' => $m['text']]]], $history);
    $decl = array_map(function ($t) {
        $d = ['name' => $t['name'], 'description' => $t['description']];
        if (!empty($t['parameters']['properties'])) $d['parameters'] = gemini_schema($t['parameters']);
        return $d;
    }, $tools);
    // Tokens de raciocínio («thinking») contam para maxOutputTokens: 2.5 Flash desliga-o; os outros
    // modelos (2.5 Pro, 3.x, aliases *-latest) recebem folga, senão a resposta pode sair vazia.
    $noThinking = strpos($cfg['model'], 'gemini-2.5-flash') === 0;
    $gen = ['maxOutputTokens' => $noThinking ? $cfg['maxTokens'] : $cfg['maxTokens'] + 2048, 'temperature' => 0.6];
    if ($noThinking) $gen['thinkingConfig'] = ['thinkingBudget' => 0];

    for ($round = 0; $round < $cfg['maxRounds']; $round++) {
        $parts = [];
        $calls = [];
        $text = '';
        $sse = '';
        $handle = function (string $block) use (&$parts, &$calls, &$text) {
            foreach (preg_split('/\r?\n/', $block) as $line) {
                if (strpos($line, 'data:') !== 0) continue;
                $json = json_decode(trim(substr($line, 5)));
                if (isset($json->candidates[0]->finishReason)) $GLOBALS['agent_finish'] = (string) $json->candidates[0]->finishReason;
                foreach ($json->candidates[0]->content->parts ?? [] as $part) {
                    $parts[] = $part;
                    if (isset($part->text) && empty($part->thought)) {
                        $text .= $part->text;
                        emit(['t' => 'text', 'd' => $part->text]);
                    }
                    if (isset($part->functionCall->name)) {
                        $args = decode_args($part->functionCall->args ?? []);
                        $calls[] = $part->functionCall->name;
                        emit(['t' => 'tool', 'name' => $part->functionCall->name, 'args' => $args]);
                    }
                }
            }
        };
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($cfg['model']) . ':streamGenerateContent?alt=sse';
        http_post($url, ['x-goog-api-key: ' . $cfg['key']], [
            'systemInstruction' => ['parts' => [['text' => $system]]],
            'contents' => $contents,
            'tools' => [['functionDeclarations' => $decl]],
            'toolConfig' => ['functionCallingConfig' => ['mode' => 'AUTO']],
            'generationConfig' => $gen,
        ], $cfg['timeout'], function ($chunk) use (&$sse, $handle) {
            $sse .= $chunk;
            while (preg_match('/\r?\n\r?\n/', $sse, $m, PREG_OFFSET_CAPTURE)) {
                $handle(substr($sse, 0, $m[0][1]));
                $sse = substr($sse, $m[0][1] + strlen($m[0][0]));
            }
        });
        $handle($sse);
        if (!$calls || trim($text) !== '') return;
        $contents[] = ['role' => 'model', 'parts' => $parts];
        $contents[] = ['role' => 'user', 'parts' => array_map(fn($n) => ['functionResponse' => ['name' => $n, 'response' => ['ok' => true]]], $calls)];
    }
}

/* ─────────────────────────── OpenAI ─────────────────────────── */

function chat_openai(array $cfg, string $system, array $history, array $tools): void
{
    $messages = array_merge([['role' => 'system', 'content' => $system]], array_map(fn($m) => ['role' => $m['role'], 'content' => $m['text']], $history));
    $fns = array_map(fn($t) => ['type' => 'function', 'function' => [
        'name' => $t['name'], 'description' => $t['description'],
        'parameters' => with_props($t['parameters']),
    ]], $tools);
    for ($round = 0; $round < $cfg['maxRounds']; $round++) {
        $res = json_decode(http_post('https://api.openai.com/v1/chat/completions', ['Authorization: Bearer ' . $cfg['key']], [
            'model' => $cfg['model'], 'messages' => $messages, 'tools' => $fns, 'tool_choice' => 'auto',
            'max_completion_tokens' => $cfg['maxTokens'],
        ], $cfg['timeout']), true);
        $msg = $res['choices'][0]['message'] ?? [];
        $text = (string) ($msg['content'] ?? '');
        if ($text !== '') emit(['t' => 'text', 'd' => $text]);
        $calls = $msg['tool_calls'] ?? [];
        foreach ($calls as $c) emit(['t' => 'tool', 'name' => $c['function']['name'], 'args' => decode_args($c['function']['arguments'] ?? '{}')]);
        if (!$calls || trim($text) !== '') return;
        $messages[] = $msg;
        foreach ($calls as $c) $messages[] = ['role' => 'tool', 'tool_call_id' => $c['id'], 'content' => '{"ok":true}'];
    }
}

/* ─────────────────────────── Anthropic ─────────────────────────── */

function chat_anthropic(array $cfg, string $system, array $history, array $tools): void
{
    $messages = array_map(fn($m) => ['role' => $m['role'], 'content' => $m['text']], $history);
    $defs = array_map(fn($t) => [
        'name' => $t['name'], 'description' => $t['description'],
        'input_schema' => with_props($t['parameters']),
    ], $tools);
    for ($round = 0; $round < $cfg['maxRounds']; $round++) {
        $res = json_decode(http_post('https://api.anthropic.com/v1/messages', ['x-api-key: ' . $cfg['key'], 'anthropic-version: 2023-06-01'], [
            'model' => $cfg['model'], 'max_tokens' => $cfg['maxTokens'], 'system' => $system, 'messages' => $messages, 'tools' => $defs,
        ], $cfg['timeout']));
        $text = '';
        $uses = [];
        foreach ($res->content ?? [] as $b) {
            if ($b->type === 'text' && $b->text !== '') {
                $text .= $b->text;
                emit(['t' => 'text', 'd' => $b->text]);
            }
            if ($b->type === 'tool_use') {
                $uses[] = $b->id;
                emit(['t' => 'tool', 'name' => $b->name, 'args' => decode_args($b->input)]);
            }
        }
        if (!$uses || trim($text) !== '') return;
        $messages[] = ['role' => 'assistant', 'content' => $res->content];
        $messages[] = ['role' => 'user', 'content' => array_map(fn($id) => ['type' => 'tool_result', 'tool_use_id' => $id, 'content' => 'ok'], $uses)];
    }
}

/* ─────────────────────────── Mock (testes, sem chave) ─────────────────────────── */

function chat_mock(array $cfg, string $system, array $history, array $tools): void
{
    [$text, $calls] = mock_reply($history);
    foreach (preg_split('/(?<=\s)/u', $text) as $i => $w) {
        emit(['t' => 'text', 'd' => $w]);
        if ($i % 4 === 3) usleep(30000);
    }
    foreach ($calls as $c) emit(['t' => 'tool', 'name' => $c[0], 'args' => $c[1]]);
}

function mock_norm(string $s): string
{
    return strtr(mb_strtolower($s), ['á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'ç' => 'c', 'é' => 'e', 'ê' => 'e', 'è' => 'e',
        'í' => 'i', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
}

/** Espelho de server/agent/mock.ts (mesmas regras, mesmas tool calls). */
function mock_reply(array $history): array
{
    $raw = $history[count($history) - 1]['text'];
    $u = mock_norm($raw);
    $all = mock_norm(implode(' ', array_map(fn($m) => $m['text'], array_filter($history, fn($m) => $m['role'] === 'user'))));
    $num = function (string $re, string $s) {
        return preg_match($re, $s, $m) ? (int) $m[1] : null;
    };
    $people = $num('/(\d+)\s*(pessoas|people|colaborador|funcionari|pessoa)/', $u);
    $hours = $num('/(\d+)\s*(h\b|horas|hours)/', $u);
    $suggest = fn(array $o) => ['suggest_replies', ['options' => $o]];

    if (preg_match('/(audio|voz|fala comigo|responde a falar|speak|voice)/', $u)) {
        return ['Claro, passo a responder também por voz. Em que processo a sua equipa perde mais tempo?',
            [['reply_with_voice', []], $suggest(['Marcações por WhatsApp', 'Faturas e documentos'])]];
    }
    if (preg_match('/(reuniao|marcar|agendar|meeting|book)/', $u)) {
        $d = new DateTime('now', new DateTimeZone('Europe/Lisbon'));
        $slots = [];
        while (count($slots) < 4) {
            $d->modify('+1 day');
            if ((int) $d->format('N') <= 5) $slots[] = $d->format('Y-m-d');
        }
        $args = ['day' => $slots[3], 'time' => '15:00', 'notes' => 'Agente de marcações para clínica'];
        if (preg_match('/chamo[- ]me ([\p{L}]+(?: [\p{L}]+)?)/iu', $raw, $m)) $args['name'] = $m[1];
        if (preg_match('/[^\s@]+@[^\s@]+\.[a-z]{2,}/i', $raw, $m)) $args['contact'] = $m[0];
        return ['Ótimo. Deixei o pedido preparado no palco com o que me disse — confirme o dia e a hora, marque o consentimento e envie.',
            [['open_booking', $args], $suggest(['Prefiro de manhã', 'Posso enviar por email?'])]];
    }
    if (preg_match('/(servic|capacidad|capabilit|usariam|would you use|tecnolog)/', $u)) {
        return ['Para o seu caso usaria três capacidades — destaquei-as no palco com o porquê de cada uma. Quer ver isto com os seus dados numa conversa de 30 minutos?',
            [['unlock_capabilities', ['ids' => ['automacao', 'desenvolvimento', 'consultoria'], 'reasons' => [
                'O agente atende e marca por WhatsApp e telefone, 24/7.',
                'Liga o agente ao software de agenda que já usam.',
                'Define regras, exceções e o que fica com a receção.',
            ]]], $suggest(['Sim, quero marcar', 'Quanto custa?'])]];
    }
    if (preg_match('/(quanto custa|preco|price|orcamento)/', $u)) {
        return ['Depende do âmbito: depois de uma conversa de 30 minutos e do diagnóstico, a DevloperEU apresenta uma proposta fechada. Quer que prepare o pedido de reunião?',
            [$suggest(['Sim, vamos marcar', 'Ainda não'])]];
    }
    if ($people !== null || $hours !== null) {
        $p = $people ?? $num('/(\d+)\s*(pessoas|people)/', $all) ?? 3;
        $h = $hours ?? $num('/(\d+)\s*(h\b|horas|hours)/', $all) ?? 8;
        return ["Com $p pessoas a $h h por semana, montei no palco um agente de marcações para o seu caso. É uma simulação ilustrativa — quer ver que capacidades usaria?",
            [['update_profile', ['team_size' => $p, 'hours_per_week' => $h]],
                ['show_simulation', ['title' => 'Agente de marcações da clínica',
                    'flow' => ['WhatsApp e chamadas', 'Entende o pedido', 'Consulta a agenda', 'Confirma e lembra'],
                    'events' => ['Mensagem no WhatsApp — «Tem vaga para destartarização?»', 'Pedido classificado: marcação · higiene oral',
                        'Agenda consultada → 3 vagas esta semana', 'Paciente escolheu quinta 10:30 → marcação criada', 'Lembrete agendado para a véspera'],
                    'people' => $p, 'hours' => $h, 'share' => 0.5]],
                $suggest(['Que serviços usariam?', 'Quero marcar reunião'])]];
    }
    if (preg_match('/(marcac|agenda|whatsapp|telefone|email|fatura|document|stock|encomend|clinica|loja|restaurante)/', $u)) {
        $sector = preg_match('/clinica/', $u) ? 'Clínica dentária' : (preg_match('/loja/', $u) ? 'Loja online' : (preg_match('/restaurante/', $u) ? 'Restauração' : 'Serviços'));
        $pain = preg_match('/marcac|agenda/', $u) ? 'Marcações por telefone e WhatsApp' : (preg_match('/fatura|document/', $u) ? 'Faturas e documentos' : 'Mensagens de clientes');
        $profile = ['sector' => $sector, 'pain' => $pain];
        if (preg_match('/whatsapp/', $u)) $profile['systems'] = 'WhatsApp, telefone';
        return ['Percebo — é dos processos em que um agente mais ajuda. Quantas pessoas tratam disto e quantas horas por semana gasta cada uma?',
            [['update_profile', $profile], $suggest(['2 pessoas, 10 horas cada', '4 pessoas, 6 horas cada'])]];
    }
    return ['Obrigado! Para lhe mostrar um agente à medida: em que setor está a sua empresa e onde é que a equipa perde mais tempo?',
        [$suggest(['Clínica — marcações', 'Loja online — mensagens', 'Escritório — faturas'])]];
}

/* ─────────────────────────── Voz ─────────────────────────── */

function pcm_to_wav(string $pcm, int $rate = 24000): string
{
    return 'RIFF' . pack('V', 36 + strlen($pcm)) . 'WAVEfmt ' . pack('VvvVVvv', 16, 1, 1, $rate, $rate * 2, 2, 16) . 'data' . pack('V', strlen($pcm)) . $pcm;
}

function tts_style(string $lang): string
{
    $accent = ['pt' => 'European Portuguese from Portugal (not Brazilian)', 'en' => 'British English', 'fr' => 'French from France',
        'es' => 'Spanish from Spain', 'de' => 'German', 'sv' => 'Swedish'][$lang] ?? 'the language of the text';
    return "Speak in a warm, clear, professional tone, in $accent.";
}

function do_tts(array $cfg, string $text, string $lang): array
{
    if ($cfg['provider'] === 'gemini') {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($cfg['ttsModel']) . ':generateContent';
        $res = json_decode(http_post($url, ['x-goog-api-key: ' . $cfg['key']], [
            'contents' => [['parts' => [['text' => tts_style($lang) . "\n\n" . $text]]]],
            'generationConfig' => ['responseModalities' => ['AUDIO'], 'speechConfig' => ['voiceConfig' => ['prebuiltVoiceConfig' => ['voiceName' => $cfg['voice']]]]],
        ], $cfg['timeout']), true);
        foreach ($res['candidates'][0]['content']['parts'] ?? [] as $p) {
            if (!empty($p['inlineData']['data'])) {
                $rate = preg_match('/rate=(\d+)/', $p['inlineData']['mimeType'] ?? '', $m) ? (int) $m[1] : 24000;
                return ['audio/wav', pcm_to_wav(base64_decode($p['inlineData']['data']), $rate)];
            }
        }
        throw new RuntimeException('tts', 502);
    }
    if ($cfg['provider'] === 'openai') {
        $audio = http_post('https://api.openai.com/v1/audio/speech', ['Authorization: Bearer ' . $cfg['key']], [
            'model' => $cfg['ttsModel'], 'voice' => $cfg['voice'], 'input' => $text, 'instructions' => tts_style($lang), 'response_format' => 'mp3',
        ], $cfg['timeout']);
        return ['audio/mpeg', $audio];
    }
    // mock: 0,6 s de tom suave
    $rate = 24000;
    $n = (int) ($rate * 0.6);
    $pcm = '';
    for ($i = 0; $i < $n; $i++) $pcm .= pack('v', (int) round(sin(2 * M_PI * 440 * $i / $rate) * 2500 * min(1, ($n - $i) / 2000)) & 0xFFFF);
    return ['audio/wav', pcm_to_wav($pcm, $rate)];
}

function do_stt(array $cfg, string $audio, string $mime): string
{
    if ($cfg['provider'] === 'gemini') {
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($cfg['model']) . ':generateContent';
        $res = json_decode(http_post($url, ['x-goog-api-key: ' . $cfg['key']], [
            'contents' => [['role' => 'user', 'parts' => [
                ['inlineData' => ['mimeType' => $mime, 'data' => base64_encode($audio)]],
                ['text' => 'Transcribe this audio exactly, in its original language. Output only the transcription.'],
            ]]],
            'generationConfig' => ['maxOutputTokens' => 300, 'temperature' => 0],
        ], $cfg['timeout']), true);
        return trim(implode('', array_map(fn($p) => $p['text'] ?? '', $res['candidates'][0]['content']['parts'] ?? [])));
    }
    if ($cfg['provider'] === 'openai') {
        $tmp = tempnam(sys_get_temp_dir(), 'stt');
        file_put_contents($tmp, $audio);
        try {
            $file = new CURLFile($tmp, $mime, strpos($mime, 'mp4') !== false ? 'audio.mp4' : 'audio.webm');
            $res = json_decode(http_post('https://api.openai.com/v1/audio/transcriptions', ['Authorization: Bearer ' . $cfg['key']],
                ['file' => $file, 'model' => $cfg['sttModel']], $cfg['timeout'], null, true), true);
        } finally {
            @unlink($tmp); // o áudio não fica guardado
        }
        return trim((string) ($res['text'] ?? ''));
    }
    return 'Tenho uma loja online e perdemos muito tempo a responder a mensagens de clientes';
}
