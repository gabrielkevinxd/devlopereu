<?php
/**
 * DevloperEU — endpoint do agente (produção: Apache/hosting partilhado, PHP >= 7.4 com cURL).
 * Mesmo contrato do middleware de dev (server/agent/*.ts); cérebro em agent-brain.json.
 *
 *   GET  ?action=health                                        → {"llm","provider","tts","stt","tier"}
 *   GET  ?action=admin   (Authorization: Bearer TOKEN)         → resumo do orçamento (sem dados pessoais)
 *   POST {"action":"chat","lang","sid","messages","state","voice"} → NDJSON {t:meta|text|tool|fallback|done}
 *   POST {"action":"tts","lang","sid","text"}                  → áudio (wav/mp3)
 *   POST {"action":"stt","sid","mime","audio"(base64)}         → {"text":..}
 *   POST {"action":"event","sid","type":"booked"}              → 204
 *   POST {"action":"admin_reset","scope":"mine"|"all"} (Authorization: Bearer TOKEN) → {ok,scope,clients,rateLimits}
 *
 * ORÇAMENTO EM EUROS: antes de cada chamada reserva-se o custo do PIOR caso no ledger (flock);
 * só passa se couber no teto. Depois liquida-se com o usage real devolvido pelo provider.
 *
 * Configuração (nunca no browser): variáveis de ambiente do alojamento, OU ficheiro
 * `devloper-agent.env` uma pasta acima de public_html, OU `api/.env` (bloqueado pelo .htaccess).
 */
declare(strict_types=1);

const KEY_VARS = ['gemini' => 'GEMINI_API_KEY', 'openai' => 'OPENAI_API_KEY', 'anthropic' => 'ANTHROPIC_API_KEY'];
const LANGS = ['pt', 'en', 'fr', 'es', 'de', 'sv'];
const ZERO_USAGE = ['inText' => 0, 'inAudio' => 0, 'outText' => 0, 'outAudio' => 0];

$brain = json_decode((string) file_get_contents(__DIR__ . '/agent-brain.json'), true);
$L = $brain['limits'];
$env = load_env();
$B = budget_cfg($env, $brain);

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
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(204);
    exit;
}

$cfg = resolve_config($env, $brain);
if (!$B['dir']) $cfg = null; // sem pasta de dados gravável não há controlo de custos → LLM desligado
$nextWorst = $cfg ? next_worst_eur($brain, billed_model($cfg, 'chat'), $cfg['provider']) : 0.0;

if ($method === 'GET') {
    if (($_GET['action'] ?? '') === 'admin') {
        if (!admin_allowed($env)) respond_json(401, ['error' => 'unauthorized']);
        if (!$B['dir']) respond_json(503, ['error' => 'no_data_dir']);
        respond_json(200, ['provider' => $cfg['provider'] ?? null, 'model' => $cfg['model'] ?? null] + budget_summary($B, $brain, $nextWorst));
    }
    $tier = $B['dir'] ? ledger_with($B, $brain, fn(&$l) => tier_of($B, $brain, $l, $nextWorst)) : 'over';
    $llm = $cfg && $tier !== 'over';
    respond_json(200, [
        'llm' => $llm,
        'provider' => $cfg ? $cfg['provider'] : null,
        'tts' => $llm && in_array($cfg['provider'], ['gemini', 'openai', 'mock'], true) && ($env['AGENT_TTS'] ?? 'on') !== 'off' && $tier === 'normal',
        'stt' => $llm && in_array($cfg['provider'], ['gemini', 'openai', 'mock'], true),
        'tier' => $tier,
    ]);
}
if ($method !== 'POST') respond_json(405, ['error' => 'method']);
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > $L['maxBodyBytes']) respond_json(413, ['error' => 'too_large']);
$body = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($body)) respond_json(400, ['error' => 'body']);
$action = (string) ($body['action'] ?? 'chat');
$lang = in_array($body['lang'] ?? '', LANGS, true) ? $body['lang'] : 'pt';
$sid = preg_match('/^[A-Za-z0-9-]{8,64}$/', (string) ($body['sid'] ?? '')) ? (string) $body['sid'] : '';
$t0 = microtime(true);

// Reinício pedido pelo dono no painel (POST + token). Nunca mexe no gasto, chamadas, dias nem reservas.
if ($action === 'admin_reset') {
    if (!admin_allowed($env)) respond_json(401, ['error' => 'unauthorized']);
    if (!$B['dir']) respond_json(503, ['error' => 'no_data_dir']);
    $scope = ($body['scope'] ?? '') === 'all' ? 'all' : 'mine';
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $n = reset_clients($B, $brain, $scope, ip_hash($B, $ip));
    if ($n === null) respond_json(429, ['error' => 'busy']);
    $rl = clear_rate_limits($scope === 'all' ? null : $ip);
    ledger_with($B, $brain, function (&$l) use ($rl) {
        $i = count($l['adminLog']) - 1;
        if ($i >= 0) $l['adminLog'][$i]['rateLimits'] = $rl;
    });
    agent_log('admin_reset', $cfg['provider'] ?? 'none', 'ok', $t0, " scope=$scope clients=$n rl=$rl");
    respond_json(200, ['ok' => true, 'scope' => $scope, 'clients' => $n, 'rateLimits' => $rl]);
}

if (!rate_limit($L)) {
    agent_log($action, $cfg['provider'] ?? 'none', 'rate_limited', $t0);
    if ($action === 'chat') fallback_and_exit('busy');
    respond_json(429, ['error' => 'busy']);
}
$key = $B['dir'] ? client_key($B, (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), $sid) : '';
$ipH = $B['dir'] ? ip_hash($B, (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown')) : '';

if ($action === 'event') {
    // Agendamento enviado (conta também os do fluxo guiado). Só contadores, sem dados pessoais.
    if (($body['type'] ?? '') === 'booked' && $B['dir']) {
        ledger_with($B, $brain, function (&$l) use ($key, $ipH) {
            touch_client($l, $key, $ipH);
            if (!$l['clients'][$key]['booked']) {
                $l['clients'][$key]['booked'] = true;
                $l['booked']++;
            }
        });
    }
    http_response_code(204);
    exit;
}

if (!$cfg) {
    agent_log($action, 'none', 'unavailable', $t0);
    if ($action === 'chat') fallback_and_exit('unavailable');
    respond_json(503, ['error' => 'unavailable']);
}

$snap = ledger_with($B, $brain, function (&$l) use ($B, $brain, $key, $nextWorst) {
    return ['tier' => tier_of($B, $brain, $l, $nextWorst), 'client' => $l['clients'][$key] ?? new_client()];
});

/** Medidor ligado ao ledger: reserva o pior caso antes, liquida o usage real depois. */
function make_meter(array $B, array $brain, string $model, string $kind, string $key, callable $worst, string $ipH = ''): array
{
    $st = (object) ['denied' => false, 'eur' => 0.0, 'in' => 0, 'out' => 0, 'resId' => null, 'worstEur' => 0.0];
    $before = function (int $chars, int $maxOut) use ($B, $brain, $model, $worst, $st): bool {
        $st->worstEur = cost_eur($brain, $model, $worst($chars, $maxOut));
        $st->resId = budget_reserve($B, $brain, $st->worstEur);
        if (!$st->resId) $st->denied = true;
        return (bool) $st->resId;
    };
    $after = function (?array $usage) use ($B, $brain, $model, $kind, $key, $st, $ipH): void {
        $eur = $usage ? cost_eur($brain, $model, $usage) : $st->worstEur;
        budget_settle($B, $brain, (string) $st->resId, $eur, $kind, $key, $ipH);
        $st->eur += $eur;
        if ($usage) {
            $st->in += $usage['inText'] + $usage['inAudio'];
            $st->out += $usage['outText'] + $usage['outAudio'];
        }
    };
    return [$before, $after, $st];
}

try {
    if ($action === 'tts') {
        if (!in_array($cfg['provider'], ['gemini', 'openai', 'mock'], true) || ($env['AGENT_TTS'] ?? 'on') === 'off') respond_json(501, ['error' => 'tts']);
        if ($snap['tier'] !== 'normal') respond_json(403, ['error' => 'tts_off']); // economia: voz do browser (grátis)
        if ($snap['client']['tts'] >= $brain['budget']['maxProviderTts']) respond_json(429, ['error' => 'tts_quota']);
        $text = trim(mb_substr((string) ($body['text'] ?? ''), 0, $L['ttsMaxChars']));
        if ($text === '') respond_json(400, ['error' => 'text']);
        [$before, $after, $st] = make_meter($B, $brain, billed_model($cfg, 'tts'), 'tts', $key, fn() => worst_tts($text), $ipH);
        if (!$before(mb_strlen($text), 0)) respond_json(402, ['error' => 'budget']);
        try {
            [$mime, $audio, $usage] = do_tts($cfg, $text, $lang);
            $after($usage);
        } catch (Throwable $e) {
            $after($e->getCode() > 0 && $e->getCode() < 599 ? ZERO_USAGE : null);
            throw $e;
        }
        header('Content-Type: ' . $mime);
        header('Cache-Control: no-store');
        echo $audio;
        agent_log('tts', $cfg['provider'], 'ok', $t0, sprintf(' eur=%.5f', $st->eur));
        exit;
    }
    if ($action === 'stt') {
        if (!in_array($cfg['provider'], ['gemini', 'openai', 'mock'], true)) respond_json(501, ['error' => 'stt']);
        if ($snap['tier'] === 'over') respond_json(402, ['error' => 'budget']);
        $audio = base64_decode((string) ($body['audio'] ?? ''), true);
        if (!$audio || strlen($audio) > $L['sttMaxBytes']) respond_json(400, ['error' => 'audio']);
        $mime = preg_match('~^audio/[\w.+-]+~', (string) ($body['mime'] ?? ''), $m) ? $m[0] : 'audio/webm';
        $bytes = strlen($audio);
        [$before, $after, $st] = make_meter($B, $brain, billed_model($cfg, 'stt'), 'stt', $key, fn() => worst_stt($bytes), $ipH);
        if (!$before(0, 0)) respond_json(402, ['error' => 'budget']);
        try {
            [$text, $usage] = do_stt($cfg, $audio, $mime);
            $after($usage);
        } catch (Throwable $e) {
            $after($e->getCode() > 0 && $e->getCode() < 599 ? ZERO_USAGE : null);
            throw $e;
        }
        agent_log('stt', $cfg['provider'], 'ok', $t0, sprintf(' eur=%.5f', $st->eur));
        respond_json(200, ['text' => mb_substr($text, 0, $L['maxMessageChars'])]);
    }

    // ─── chat ───
    $history = normalize_history($body['messages'] ?? null, $L);
    if (!$history) respond_json(400, ['error' => 'messages']);
    $c = $snap['client'];
    $progress = max($c['eur'] / $B['clientEur'], $c['turns'] / $B['maxTurns']);
    $refuse = function (string $reason) use ($cfg, $t0) {
        agent_log('chat', $cfg['provider'], $reason, $t0);
        fallback_and_exit($reason);
    };
    if ($snap['tier'] === 'over') $refuse('budget');
    if ($c['mode'] === 'closed') $refuse('closed');
    if ($progress >= 1) $refuse('client_limit');
    if ($snap['tier'] === 'reserve' && $c['turns'] === 0 && !qualified_state($body['state'] ?? null)) $refuse('reserve');

    $check = $c['mode'] === 'check' || $progress >= $brain['budget']['checkMatchAt'];
    if (($body['voice'] ?? false) === true) $history[count($history) - 1]['text'] .= "\n[The visitor is using voice.]";
    $slotDay = workday_slots(1)[0];
    $slotTime = $brain['budget']['proposedTime'];
    $system = build_system($brain, $lang, $body['state'] ?? new stdClass());
    if ($snap['tier'] !== 'normal') $system .= $brain['prompts']['economy'];
    if ($check) $system .= strtr($brain['prompts']['checkMatch'], ['{slotDay}' => $slotDay, '{slotTime}' => $slotTime]);
    $callCfg = $cfg;
    if ($snap['tier'] !== 'normal') $callCfg['maxTokens'] = $brain['budget']['economyMaxOutputTokens'];

    stream_start();
    emit(['t' => 'meta', 'tier' => $snap['tier'], 'check' => $check]);
    $last = $history[count($history) - 1]['text'];
    foreach ($brain['guard']['patterns'] as $p) {
        if (preg_match('~' . $p . '~iu', $last)) {
            emit(['t' => 'text', 'd' => $brain['guard']['redirect'][$lang] ?? $brain['guard']['redirect']['en']]);
            emit(['t' => 'done', 'provider' => 'guard']);
            agent_log('chat', $cfg['provider'], 'guard', $t0);
            exit;
        }
    }

    // Interceta as tool calls: o servidor decide a qualificação pela regra explícita (4 critérios).
    $turn = (object) ['text' => false, 'outcome' => null, 'fails' => [], 'booking' => false];
    $GLOBALS['agent_on_emit'] = function (array $e) use ($turn, $check): ?array {
        if ($e['t'] === 'text' && ($e['d'] ?? '') !== '') $turn->text = true;
        // qualify_lead só conta em CHECK MATCH (visto num teste real: o modelo chamou-a no 1.º turno)
        if ($e['t'] === 'tool' && $e['name'] === 'qualify_lead' && !$check) return null;
        if ($e['t'] === 'tool' && $e['name'] === 'qualify_lead') {
            $a = $e['args'];
            $crit = [];
            foreach (['company', 'pain', 'automatable', 'decision'] as $k) $crit[$k] = ($a[$k] ?? false) === true;
            $turn->outcome = !in_array(false, $crit, true) ? 'qualified' : 'disqualified';
            $turn->fails = array_keys(array_filter($crit, fn($v) => !$v));
            $e['args'] = $crit + ['qualified' => $turn->outcome === 'qualified'];
        }
        if ($e['t'] === 'tool' && $e['name'] === 'open_booking') $turn->booking = true;
        return $e;
    };
    [$before, $after, $st] = make_meter($B, $brain, billed_model($cfg, 'chat'), 'chat', $key,
        fn(int $chars, int $maxOut) => worst_chat($brain, $chars, $maxOut), $ipH);
    try {
        $fn = 'chat_' . $cfg['provider'];
        $tools = $check ? $brain['tools'] : array_values(array_filter($brain['tools'], fn($t) => $t['name'] !== 'qualify_lead'));
        $fn($callCfg, $system, $history, $tools, $before, $after);
    } catch (Throwable $e) {
        agent_log('chat', $cfg['provider'], 'error:' . $e->getCode(), $t0, sprintf(' eur=%.5f', $st->eur));
        emit(['t' => 'fallback', 'reason' => 'provider']);
        exit;
    }
    if ($st->denied && !$turn->text) {
        agent_log('chat', $cfg['provider'], 'budget', $t0);
        emit(['t' => 'fallback', 'reason' => 'budget']);
        exit;
    }
    if ($check && $turn->outcome === 'qualified' && !$turn->booking) {
        emit(['t' => 'tool', 'name' => 'open_booking', 'args' => ['day' => $slotDay, 'time' => $slotTime]]); // data proposta garantida
    }
    ledger_with($B, $brain, function (&$l) use ($key, $check, $turn, $ipH) {
        touch_client($l, $key, $ipH);
        $r = &$l['clients'][$key];
        $r['turns']++;
        $r['last'] = time();
        if ($check && $r['mode'] === 'normal') {
            $r['mode'] = 'check';
            $r['checkAt'] = time();
        }
        if ($turn->outcome && !$r['outcome']) {
            $r['outcome'] = $turn->outcome;
            if ($turn->outcome === 'disqualified') {
                $r['mode'] = 'closed'; // termina a conversa com o LLM
                foreach ($turn->fails as $f) $l['fails'][$f]++;
            }
        }
    });
    emit(['t' => 'done', 'provider' => $cfg['provider']]);
    agent_log('chat', $cfg['provider'], 'ok', $t0, sprintf(' eur=%.5f in=%d out=%d tier=%s check=%d%s', $st->eur, $st->in, $st->out,
        $snap['tier'], $check ? 1 : 0, $turn->outcome ? ' outcome=' . $turn->outcome : ''));
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
        'AGENT_VOICE', 'AGENT_TTS', 'AGENT_ALLOWED_ORIGINS', 'AGENT_DISABLED', 'AGENT_BUDGET_EUR', 'AGENT_BUDGET_PERIOD',
        'AGENT_TARGET_CONVERSATIONS', 'AGENT_MAX_TURNS', 'AGENT_DATA_DIR', 'AGENT_ADMIN_TOKEN'];
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

function billed_model(array $cfg, string $kind): string
{
    if ($cfg['provider'] === 'mock') return $kind === 'tts' ? 'mock-tts' : 'mock';
    if ($kind === 'tts') return $cfg['ttsModel'];
    if ($kind === 'stt' && $cfg['provider'] === 'openai') return $cfg['sttModel'];
    return $cfg['model'];
}

function workday_slots(int $n): array
{
    $d = new DateTime('now', new DateTimeZone('Europe/Lisbon'));
    $out = [];
    while (count($out) < $n) {
        $d->modify('+1 day');
        if ((int) $d->format('N') <= 5) $out[] = $d->format('Y-m-d');
    }
    return $out;
}

function build_system(array $brain, string $lang, $state): string
{
    $tz = new DateTimeZone('Europe/Lisbon');
    $today = (new DateTime('now', $tz))->format('Y-m-d');
    $slots = array_map(fn($s) => $s . ' (' . (new DateTime($s, $tz))->format('D') . ')', workday_slots(10));
    $stateJson = mb_substr((string) json_encode($state, JSON_UNESCAPED_UNICODE), 0, 1500);
    return strtr($brain['system'], [
        '{lang}' => $lang, '{today}' => $today, '{slots}' => implode(', ', $slots),
        '{times}' => implode(', ', $brain['times']), '{state}' => $stateJson,
    ]);
}

function qualified_state($state): bool
{
    $p = is_array($state) && is_array($state['profile'] ?? null) ? $state['profile'] : [];
    return !empty($p['sector']) && !empty($p['pain']) && (!empty($p['team']) || !empty($p['hours']));
}

function admin_allowed(array $env): bool
{
    $token = (string) ($env['AGENT_ADMIN_TOKEN'] ?? '');
    if (strlen($token) < 24) return false; // painel desligado sem token forte
    $auth = (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    $got = preg_replace('/^Bearer\s+/i', '', $auth) ?: (string) ($_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '');
    return hash_equals($token, $got);
}

/* ─────────────────────────── Orçamento em euros ─────────────────────────── */

function budget_cfg(array $env, array $brain): array
{
    $b = $brain['budget'];
    $eur = (float) ($env['AGENT_BUDGET_EUR'] ?? 0) > 0 ? (float) $env['AGENT_BUDGET_EUR'] : (float) $b['eur'];
    $period = in_array($env['AGENT_BUDGET_PERIOD'] ?? '', ['month', 'week', 'day'], true) ? $env['AGENT_BUDGET_PERIOD'] : $b['period'];
    $target = (int) ($env['AGENT_TARGET_CONVERSATIONS'] ?? 0) > 0 ? (int) $env['AGENT_TARGET_CONVERSATIONS'] : (int) $b['targetConversations'];
    $turns = (int) ($env['AGENT_MAX_TURNS'] ?? 0) > 0 ? (int) $env['AGENT_MAX_TURNS'] : (int) $b['maxTurns'];
    return ['eur' => $eur, 'period' => $period, 'targetConversations' => $target, 'maxTurns' => $turns,
        'clientEur' => $eur / $target, 'dir' => data_dir($env)];
}

/** Pasta persistente e gravável FORA do public_html (ou api/data, protegida). Sem ela o LLM fica desligado. */
function data_dir(array $env): ?string
{
    $cands = array_filter([(string) ($env['AGENT_DATA_DIR'] ?? ''), dirname(__DIR__, 2) . '/devloper-agent-data', __DIR__ . '/data']);
    foreach ($cands as $d) {
        if (!is_dir($d)) @mkdir($d, 0700, true);
        if (is_dir($d) && is_writable($d)) return rtrim($d, '/\\');
    }
    return null;
}

function price_for(array $brain, string $model): array
{
    $m = $brain['pricing']['models'];
    if (isset($m[$model])) return $m[$model];
    $best = null;
    foreach (array_keys($m) as $k) {
        if ($k[0] !== '_' && strpos($model, $k) === 0 && ($best === null || strlen($k) > strlen($best))) $best = $k;
    }
    return $best ? $m[$best] : $m['_unknown'];
}

/** EUR com margem de segurança. */
function cost_eur(array $brain, string $model, array $u): float
{
    $p = price_for($brain, $model);
    $usd = ($u['inText'] * ($p['input'] ?? 0) + $u['inAudio'] * ($p['inputAudio'] ?? $p['input'] ?? 0)
        + $u['outText'] * ($p['output'] ?? 0) + $u['outAudio'] * ($p['outputAudio'] ?? $p['output'] ?? 0)) / 1e6;
    return $usd * $brain['pricing']['eurPerUsd'] * $brain['pricing']['safetyMargin'];
}

function worst_chat(array $brain, int $chars, int $maxOut): array
{
    return ['inText' => (int) ceil($chars / $brain['budget']['charsPerTokenWorst']) + 200, 'inAudio' => 0, 'outText' => $maxOut, 'outAudio' => 0];
}
function worst_tts(string $text): array
{
    $n = mb_strlen($text);
    return ['inText' => (int) ceil($n / 2) + 100, 'inAudio' => 0, 'outText' => 0, 'outAudio' => $n * 3 + 200];
}
function worst_stt(int $bytes): array
{
    return ['inText' => 100, 'inAudio' => (int) ceil($bytes / 1000 * 32) + 100, 'outText' => 300, 'outAudio' => 0];
}

function period_key(string $period, string $tz): string
{
    $d = new DateTime('now', new DateTimeZone($tz));
    if ($period === 'day') return $d->format('Y-m-d');
    if ($period === 'week') return $d->format('o-\WW');
    return $d->format('Y-m');
}

function new_client(): array
{
    return ['eur' => 0.0, 'turns' => 0, 'tts' => 0, 'first' => time(), 'last' => time(), 'mode' => 'normal', 'checkAt' => null,
        'outcome' => null, 'booked' => false];
}

function empty_ledger(string $period): array
{
    return ['v' => 1, 'period' => $period, 'spentEur' => 0.0, 'reservations' => [], 'calls' => ['chat' => 0, 'tts' => 0, 'stt' => 0, 'denied' => 0],
        'byDay' => [], 'clients' => [], 'booked' => 0, 'fails' => ['company' => 0, 'pain' => 0, 'automatable' => 0, 'decision' => 0],
        'archived' => ['conversations' => 0, 'turns' => 0, 'eur' => 0.0, 'qualified' => 0, 'disqualified' => 0, 'noAnswer' => 0], 'adminLog' => []];
}

function salt(array $B): string
{
    $f = $B['dir'] . '/salt.txt';
    if (!is_file($f)) @file_put_contents($f, bin2hex(random_bytes(24)), LOCK_EX);
    return trim((string) @file_get_contents($f));
}

/** Hash do IP (com sal secreto) guardado no registo do cliente — nunca o IP em claro. */
function ip_hash(array $B, string $ip): string
{
    return substr(hash('sha256', salt($B) . '|' . $ip), 0, 24);
}

/** Obtém (ou cria) o registo do cliente e associa-lhe o hash do IP. */
function touch_client(array &$l, string $key, string $ipH): void
{
    if (!isset($l['clients'][$key])) $l['clients'][$key] = new_client();
    if ($ipH !== '' && empty($l['clients'][$key]['ip'])) $l['clients'][$key]['ip'] = $ipH;
}

/**
 * Reinício do dono: apaga os clientes (só do seu IP, ou todos), arquivando os totais.
 * NUNCA mexe em spentEur, calls, byDay nem nas reservas. null = ação limitada (máx. 10 por 10 min).
 */
function reset_clients(array $B, array $brain, string $scope, string $ipH): ?int
{
    return ledger_with($B, $brain, function (&$l) use ($scope, $ipH) {
        $now = time();
        $recent = array_filter($l['adminLog'], fn($e) => $now - strtotime($e['at']) < 600);
        if (count($recent) >= 10) return null;
        $n = 0;
        foreach ($l['clients'] as $k => $c) {
            if ($scope !== 'all' && ($c['ip'] ?? '') !== $ipH) continue;
            if ($c['turns'] > 0) {
                $l['archived']['conversations']++;
                $l['archived']['turns'] += $c['turns'];
                $l['archived']['eur'] += $c['eur'];
                if ($c['outcome'] === 'qualified') $l['archived']['qualified']++;
                if ($c['outcome'] === 'disqualified') $l['archived']['disqualified']++;
                if ($c['mode'] === 'check' && !$c['outcome']) $l['archived']['noAnswer']++;
            }
            unset($l['clients'][$k]);
            $n++;
        }
        $l['adminLog'][] = ['at' => gmdate('Y-m-d\TH:i:s\Z', $now), 'scope' => $scope, 'clients' => $n, 'rateLimits' => 0];
        $l['adminLog'] = array_slice($l['adminLog'], -20);
        return $n;
    });
}

/** Apaga os ficheiros de rate limit de um IP (ou de todos). Devolve quantos foram apagados. */
function clear_rate_limits(?string $ip): int
{
    $dir = sys_get_temp_dir() . '/devloper-agent-rl';
    if ($ip !== null) {
        $f = $dir . '/' . substr(hash('sha256', 'devloper-agent:' . $ip . ':' . __FILE__), 0, 24) . '.json';
        return is_file($f) && @unlink($f) ? 1 : 0;
    }
    $n = 0;
    foreach (glob($dir . '/*.json') ?: [] as $f) if (@unlink($f)) $n++;
    return $n;
}

/** Chave do cliente: hash(sal secreto + IP + sessão). Nunca se guarda IP nem id de sessão em claro. */
function client_key(array $B, string $ip, string $sid): string
{
    return substr(hash('sha256', salt($B) . '|' . $ip . '|' . $sid), 0, 24);
}

/** Abre o ledger do período com flock exclusivo, aplica $fn(&$ledger) e grava. */
function ledger_with(array $B, array $brain, callable $fn)
{
    $period = period_key($B['period'], $brain['budget']['timezone']);
    $fh = fopen($B['dir'] . '/ledger-' . $period . '.json', 'c+');
    if (!$fh) throw new RuntimeException('ledger', 500);
    flock($fh, LOCK_EX);
    try {
        $raw = stream_get_contents($fh);
        $l = $raw ? json_decode($raw, true) : null;
        $l = is_array($l) ? $l + empty_ledger($period) : empty_ledger($period);
        $now = time();
        foreach ($l['reservations'] as $id => $r) {
            if ($now - $r['t'] > $brain['budget']['reservationTtlSec']) unset($l['reservations'][$id]); // reserva órfã
        }
        $out = $fn($l);
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, (string) json_encode($l));
        fflush($fh);
        return $out;
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
}

function reserved_eur(array $l): float
{
    return (float) array_sum(array_column($l['reservations'], 'eur'));
}

/** Pior caso de UMA chamada de chat típica (prompt + ferramentas + histórico máximo + saída máxima). */
function next_worst_eur(array $brain, string $model, string $provider): float
{
    $chars = mb_strlen($brain['system']) + 1500 + strlen((string) json_encode($brain['tools'])) + $brain['limits']['maxHistoryChars'];
    $thinking = $provider === 'gemini' && strpos($model, 'gemini-2.5-flash') !== 0 ? 2048 : 0;
    return cost_eur($brain, $model, worst_chat($brain, $chars, $brain['limits']['maxOutputTokens'] + $thinking));
}

/** «over» = já não cabe o pior caso da próxima chamada dentro do teto → fluxo guiado até ao próximo período. */
function tier_of(array $B, array $brain, array $l, float $nextWorst = 0.0): string
{
    $used = $l['spentEur'] + reserved_eur($l);
    $pct = $used / $B['eur'];
    if ($pct >= 1 || $used + $nextWorst > $B['eur'] * $brain['budget']['hardCeiling']) return 'over';
    if ($pct >= $brain['budget']['tiers']['reserve']) return 'reserve';
    if ($pct >= $brain['budget']['tiers']['economy']) return 'economy';
    return 'normal';
}

/** Reserva o pior caso se couber no teto (orçamento × hardCeiling). */
function budget_reserve(array $B, array $brain, float $eur): ?string
{
    return ledger_with($B, $brain, function (&$l) use ($B, $brain, $eur) {
        if ($l['spentEur'] + reserved_eur($l) + $eur > $B['eur'] * $brain['budget']['hardCeiling']) {
            $l['calls']['denied']++;
            return null;
        }
        $id = bin2hex(random_bytes(8));
        $l['reservations'][$id] = ['eur' => $eur, 't' => time()];
        return $id;
    });
}

/** Troca a reserva pelo custo real e acumula no período, no dia e no cliente. */
function budget_settle(array $B, array $brain, string $id, float $eur, string $kind, string $key, string $ipH = ''): void
{
    ledger_with($B, $brain, function (&$l) use ($brain, $id, $eur, $kind, $key, $ipH) {
        unset($l['reservations'][$id]);
        $l['spentEur'] += $eur;
        $l['calls'][$kind]++;
        $day = (new DateTime('now', new DateTimeZone($brain['budget']['timezone'])))->format('Y-m-d');
        $l['byDay'][$day] = ($l['byDay'][$day] ?? 0) + $eur;
        if ($key !== '') {
            touch_client($l, $key, $ipH);
            $l['clients'][$key]['eur'] += $eur;
            $l['clients'][$key]['last'] = time();
            if ($kind === 'tts') $l['clients'][$key]['tts']++;
        }
    });
}

/** Resumo para o painel do dono — só agregados, sem dados pessoais. */
function budget_summary(array $B, array $brain, float $nextWorst): array
{
    return ledger_with($B, $brain, function (&$l) use ($B, $brain, $nextWorst) {
        $convs = array_values(array_filter($l['clients'], fn($c) => $c['turns'] > 0));
        $now = time();
        $stale = fn($c) => $c['mode'] === 'check' && !$c['outcome'] && $now - $c['last'] > $brain['budget']['noAnswerAfterSec'];
        $a = $l['archived'];
        $n = count($convs) + $a['conversations'];
        $avg = $n ? (array_sum(array_column($convs, 'eur')) + $a['eur']) / $n : 0.0;
        $remaining = max(0.0, $B['eur'] - $l['spentEur']);
        return [
            'period' => $l['period'],
            'budgetEur' => $B['eur'],
            'spentEur' => round($l['spentEur'], 5),
            'reservedEur' => round(reserved_eur($l), 5),
            'pct' => round($l['spentEur'] / $B['eur'] * 100, 2),
            'tier' => tier_of($B, $brain, $l, $nextWorst),
            'nextCallWorstCaseEur' => round($nextWorst, 5),
            'perConversationLimitEur' => round($B['clientEur'], 4),
            'conversations' => $n,
            'activeClients' => count($l['clients']),
            'turns' => (int) array_sum(array_column($convs, 'turns')) + $a['turns'],
            'avgCostPerConversationEur' => round($avg, 5),
            'conversationsLeftEstimate' => (int) floor($remaining / ($avg > 0 ? $avg : $B['clientEur'])),
            'calls' => $l['calls'],
            'outcomes' => [
                'qualified' => count(array_filter($convs, fn($c) => $c['outcome'] === 'qualified')) + $a['qualified'],
                'disqualified' => count(array_filter($convs, fn($c) => $c['outcome'] === 'disqualified')) + $a['disqualified'],
                'noAnswer' => count(array_filter($convs, $stale)) + $a['noAnswer'],
                'pendingCheckMatch' => count(array_filter($convs, fn($c) => $c['mode'] === 'check' && !$c['outcome'] && !$stale($c))),
            ],
            'disqualifiedBy' => $l['fails'],
            'booked' => $l['booked'],
            'byDay' => $l['byDay'] ?: new stdClass(),
            'resets' => array_reverse(array_slice($l['adminLog'], -5)),
        ];
    });
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

/** Anti-abuso por hash de IP (o IP nunca é guardado em claro). Os custos são geridos em euros. */
function rate_limit(array $L): bool
{
    $dir = sys_get_temp_dir() . '/devloper-agent-rl';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $file = $dir . '/' . substr(hash('sha256', 'devloper-agent:' . $ip . ':' . __FILE__), 0, 24) . '.json';
    $now = time();
    $day = gmdate('Y-m-d');
    $fh = @fopen($file, 'c+');
    if (!$fh) return true; // sem disco temporário: não bloquear o visitante (o orçamento protege os custos)
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

/** Log sem conteúdo nem dados pessoais. */
function agent_log(string $action, string $provider, string $status, float $t0, string $extra = ''): void
{
    $finish = $GLOBALS['agent_finish'] ?? '';
    error_log(sprintf('[agent] %s provider=%s status=%s ms=%d%s%s', $action, $provider, $status, (int) ((microtime(true) - $t0) * 1000),
        $finish ? " finish=$finish" : '', $extra));
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

function fallback_and_exit(string $reason): void
{
    stream_start();
    emit(['t' => 'fallback', 'reason' => $reason]);
    exit;
}

function emit(?array $e): void
{
    if (isset($GLOBALS['agent_on_emit'])) $e = ($GLOBALS['agent_on_emit'])($e);
    if ($e === null) return;
    if (isset($e['args']) && is_array($e['args']) && !$e['args']) $e['args'] = new stdClass();
    echo json_encode($e, JSON_UNESCAPED_UNICODE), "\n";
    @flush();
}

/* ─────────────────────────── HTTP ─────────────────────────── */

/** POST JSON. Com $onChunk, entrega o corpo aos bocados (streaming). Lança exceção com o status HTTP (599 = rede). */
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

/** Executa uma ronda medida: reserva → chamada → liquida. Erros HTTP (4xx/5xx) não são faturados; rede/timeout cobra o pior caso. */
function metered(callable $before, callable $after, int $chars, int $maxOut, callable $call)
{
    if (!$before($chars, $maxOut)) return null;
    try {
        [$value, $usage] = $call();
        $after($usage);
        return $value;
    } catch (Throwable $e) {
        $after($e->getCode() > 0 && $e->getCode() < 599 ? ZERO_USAGE : null);
        throw $e;
    }
}

function decode_args($a): array
{
    if (is_array($a)) return $a;
    if (is_object($a)) return json_decode((string) json_encode($a), true) ?: [];
    $v = json_decode((string) $a, true);
    return is_array($v) ? $v : [];
}

/** JSON Schema com «properties» sempre objeto (o PHP descodifica {} vazio como []). */
function with_props(array $schema): array
{
    if (empty($schema['properties'])) $schema['properties'] = new stdClass();
    return $schema;
}

/** usageMetadata do Gemini → usage (tokens de raciocínio contam como saída). */
function gemini_usage($u, bool $audioOut = false): ?array
{
    if (!$u) return null;
    $u = decode_args($u);
    if (!isset($u['promptTokenCount'])) return null;
    $inAudio = 0;
    foreach ($u['promptTokensDetails'] ?? [] as $d) if (($d['modality'] ?? '') === 'AUDIO') $inAudio += (int) ($d['tokenCount'] ?? 0);
    $out = (int) ($u['candidatesTokenCount'] ?? 0) + (int) ($u['thoughtsTokenCount'] ?? 0);
    return ['inText' => (int) $u['promptTokenCount'] - $inAudio, 'inAudio' => $inAudio, 'outText' => $audioOut ? 0 : $out, 'outAudio' => $audioOut ? $out : 0];
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

function chat_gemini(array $cfg, string $system, array $history, array $tools, callable $before, callable $after): void
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
    $maxOut = $noThinking ? $cfg['maxTokens'] : $cfg['maxTokens'] + 2048;
    $gen = ['maxOutputTokens' => $maxOut, 'temperature' => 0.6];
    if ($noThinking) $gen['thinkingConfig'] = ['thinkingBudget' => 0];
    $declJson = (string) json_encode($decl);

    for ($round = 0; $round < $cfg['maxRounds']; $round++) {
        $chars = mb_strlen($system) + strlen($declJson) + mb_strlen((string) json_encode($contents, JSON_UNESCAPED_UNICODE));
        $r = metered($before, $after, $chars, $maxOut, function () use ($cfg, $system, $contents, $decl, $gen) {
            $parts = [];
            $calls = [];
            $text = '';
            $usage = null;
            $sse = '';
            $handle = function (string $block) use (&$parts, &$calls, &$text, &$usage) {
                foreach (preg_split('/\r?\n/', $block) as $line) {
                    if (strpos($line, 'data:') !== 0) continue;
                    $json = json_decode(trim(substr($line, 5)));
                    if (isset($json->usageMetadata)) $usage = gemini_usage($json->usageMetadata) ?? $usage; // o último bloco traz o total
                    if (isset($json->candidates[0]->finishReason)) $GLOBALS['agent_finish'] = (string) $json->candidates[0]->finishReason;
                    foreach ($json->candidates[0]->content->parts ?? [] as $part) {
                        $parts[] = $part;
                        if (isset($part->text) && empty($part->thought)) {
                            $text .= $part->text;
                            emit(['t' => 'text', 'd' => $part->text]);
                        }
                        if (isset($part->functionCall->name)) {
                            $calls[] = $part->functionCall->name;
                            emit(['t' => 'tool', 'name' => $part->functionCall->name, 'args' => decode_args($part->functionCall->args ?? [])]);
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
            return [['parts' => $parts, 'calls' => $calls, 'text' => $text], $usage];
        });
        if (!$r || !$r['calls'] || trim($r['text']) !== '') return;
        $contents[] = ['role' => 'model', 'parts' => $r['parts']];
        $contents[] = ['role' => 'user', 'parts' => array_map(fn($n) => ['functionResponse' => ['name' => $n, 'response' => ['ok' => true]]], $r['calls'])];
    }
}

/* ─────────────────────────── OpenAI ─────────────────────────── */

function chat_openai(array $cfg, string $system, array $history, array $tools, callable $before, callable $after): void
{
    $messages = array_merge([['role' => 'system', 'content' => $system]], array_map(fn($m) => ['role' => $m['role'], 'content' => $m['text']], $history));
    $fns = array_map(fn($t) => ['type' => 'function', 'function' => [
        'name' => $t['name'], 'description' => $t['description'], 'parameters' => with_props($t['parameters']),
    ]], $tools);
    for ($round = 0; $round < $cfg['maxRounds']; $round++) {
        $chars = mb_strlen((string) json_encode($messages, JSON_UNESCAPED_UNICODE)) + strlen((string) json_encode($fns));
        $msg = metered($before, $after, $chars, $cfg['maxTokens'], function () use ($cfg, $messages, $fns) {
            $res = json_decode(http_post('https://api.openai.com/v1/chat/completions', ['Authorization: Bearer ' . $cfg['key']], [
                'model' => $cfg['model'], 'messages' => $messages, 'tools' => $fns, 'tool_choice' => 'auto',
                'max_completion_tokens' => $cfg['maxTokens'],
            ], $cfg['timeout']), true);
            $u = $res['usage'] ?? null;
            $usage = $u ? ['inText' => (int) ($u['prompt_tokens'] ?? 0), 'inAudio' => 0, 'outText' => (int) ($u['completion_tokens'] ?? 0), 'outAudio' => 0] : null;
            return [$res['choices'][0]['message'] ?? [], $usage];
        });
        if ($msg === null) return;
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

function chat_anthropic(array $cfg, string $system, array $history, array $tools, callable $before, callable $after): void
{
    $messages = array_map(fn($m) => ['role' => $m['role'], 'content' => $m['text']], $history);
    $defs = array_map(fn($t) => ['name' => $t['name'], 'description' => $t['description'], 'input_schema' => with_props($t['parameters'])], $tools);
    for ($round = 0; $round < $cfg['maxRounds']; $round++) {
        $chars = mb_strlen($system) + mb_strlen((string) json_encode($messages, JSON_UNESCAPED_UNICODE)) + strlen((string) json_encode($defs));
        $res = metered($before, $after, $chars, $cfg['maxTokens'], function () use ($cfg, $system, $messages, $defs) {
            $res = json_decode(http_post('https://api.anthropic.com/v1/messages', ['x-api-key: ' . $cfg['key'], 'anthropic-version: 2023-06-01'], [
                'model' => $cfg['model'], 'max_tokens' => $cfg['maxTokens'], 'system' => $system, 'messages' => $messages, 'tools' => $defs,
            ], $cfg['timeout']));
            $u = $res->usage ?? null;
            $usage = $u ? ['inText' => (int) ($u->input_tokens ?? 0) + (int) ($u->cache_creation_input_tokens ?? 0) + (int) ($u->cache_read_input_tokens ?? 0),
                'inAudio' => 0, 'outText' => (int) ($u->output_tokens ?? 0), 'outAudio' => 0] : null;
            return [$res, $usage];
        });
        if ($res === null) return;
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

function chat_mock(array $cfg, string $system, array $history, array $tools, callable $before, callable $after): void
{
    $chars = mb_strlen($system) + mb_strlen((string) json_encode($tools, JSON_UNESCAPED_UNICODE)) + mb_strlen((string) json_encode($history, JSON_UNESCAPED_UNICODE));
    metered($before, $after, $chars, $cfg['maxTokens'], function () use ($system, $history, $chars) {
        [$text, $calls] = mock_reply($history, $system);
        foreach (preg_split('/(?<=\s)/u', $text) as $i => $w) {
            emit(['t' => 'text', 'd' => $w]);
            if ($i % 4 === 3) usleep(30000);
        }
        foreach ($calls as $c) emit(['t' => 'tool', 'name' => $c[0], 'args' => $c[1]]);
        // usage sintético realista (≈ 4 caracteres por token), faturado como gemini-2.5-flash
        $outChars = mb_strlen($text) + mb_strlen((string) json_encode($calls, JSON_UNESCAPED_UNICODE));
        return [null, ['inText' => (int) ceil($chars / 4), 'inAudio' => 0, 'outText' => (int) ceil($outChars / 4) + 10, 'outAudio' => 0]];
    });
}

function mock_norm(string $s): string
{
    return strtr(mb_strtolower($s), ['á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'ç' => 'c', 'é' => 'e', 'ê' => 'e', 'è' => 'e',
        'í' => 'i', 'ó' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
}

/** Espelho de server/agent/mock.ts (mesmas regras, mesmas tool calls). */
function mock_reply(array $history, string $system = ''): array
{
    $raw = $history[count($history) - 1]['text'];
    $u = mock_norm($raw);
    $all = mock_norm(implode(' ', array_map(fn($m) => $m['text'], array_filter($history, fn($m) => $m['role'] === 'user'))));
    $num = function (string $re, string $s) {
        return preg_match($re, $s, $m) ? (int) $m[1] : null;
    };

    // CHECK MATCH: a conversa está perto do limite → resumo + decisão de qualificação.
    if (strpos($system, 'CHECK MATCH') !== false) {
        $crit = [
            'company' => (bool) preg_match('/(clinica|loja|empresa|escritorio|restaurante|fabrica|hotel|imobiliaria|contabilidade)/', $all),
            'pain' => (bool) preg_match('/(marcac|fatura|mensag|email|stock|encomend|document|agenda|telefone|relatorio)/', $all),
        ];
        $crit['automatable'] = $crit['pain'];
        $crit['decision'] = (bool) preg_match('/(sou (o |a )?(dono|dona|socio|socia|gerente|diretor|diretora|responsavel)|decido|este mes|este trimestre|ate ao fim do ano|urgente)/', $all);
        preg_match('/day (\d{4}-\d{2}-\d{2}) and time (\d{2}:\d{2})/', $system, $slot);
        if (!in_array(false, $crit, true)) {
            $summary = 'Clínica com marcações manuais por telefone e WhatsApp, equipa de receção sobrecarregada';
            return ['Resumindo: ' . mb_strtolower($summary) . ' — um caso claro para um agente. Faz sentido marcarmos 30 minutos? Deixei ' . ($slot[1] ?? '') . ' às ' . ($slot[2] ?? '') . ' pré-preenchido no palco; é só confirmar.',
                [['qualify_lead', ['qualified' => true] + $crit + ['reason' => 'Todos os critérios cumpridos']],
                    ['open_booking', ['day' => $slot[1] ?? null, 'time' => $slot[2] ?? null, 'notes' => $summary]]]];
        }
        return ['Obrigado pela conversa! Pelo que me contou, uma reunião ainda não é o melhor próximo passo. Deixo-lhe a checklist gratuita das 12 tarefas e os nossos contactos — WhatsApp +351 929 070 650 ou devlopereu@gmail.com — para quando fizer sentido.',
            [['qualify_lead', ['qualified' => false] + $crit + ['reason' => 'Sem empresa nem processo concreto']]]];
    }

    $people = $num('/(\d+)\s*(pessoas|people|colaborador|funcionari|pessoa)/', $u);
    $hours = $num('/(\d+)\s*(h\b|horas|hours)/', $u);
    $suggest = fn(array $o) => ['suggest_replies', ['options' => $o]];

    if (preg_match('/teste-qualify-fora-de-hora/', $u)) {
        // imita o que se viu num teste real: o modelo chama qualify_lead fora do CHECK MATCH
        return ['Percebo. Em que processo a equipa perde mais tempo?', [['qualify_lead', ['qualified' => false, 'company' => false, 'pain' => false, 'automatable' => false, 'decision' => false]]]];
    }
    if (preg_match('/(audio|voz|fala comigo|responde a falar|speak|voice)/', $u)) {
        return ['Claro, passo a responder também por voz. Em que processo a sua equipa perde mais tempo?',
            [['reply_with_voice', []], $suggest(['Marcações por WhatsApp', 'Faturas e documentos'])]];
    }
    if (preg_match('/(reuniao|marcar|agendar|meeting|book)/', $u)) {
        $slots = workday_slots(4);
        $args = ['day' => $slots[3], 'time' => '15:00', 'notes' => 'Agente de marcações para clínica'];
        if (preg_match('/chamo[- ]me ([\p{L}]+(?: [\p{L}]+)?)/iu', $raw, $m)) $args['name'] = $m[1];
        if (preg_match('/[^\s@]+@[^\s@]+\.[a-z]{2,}/i', $raw, $m)) $args['contact'] = $m[0];
        return ['Ótimo. Deixei o pedido preparado no palco com o que me disse — confirme o dia e a hora, marque o consentimento e envie.',
            [['open_booking', $args], $suggest(['Prefiro de manhã', 'Posso enviar por email?'])]];
    }
    if (preg_match('/(servic|capacidad|capabilit|usariam|would you use|tecnolog)/', $u)) {
        return ['Para o seu caso usaria três capacidades — destaquei-as no palco com o porquê de cada uma. Quer ver isto com os seus dados numa conversa de 30 minutos?',
            [['unlock_capabilities', ['ids' => ['agente-voz', 'whatsapp', 'integracoes-mcp'], 'reasons' => [
                'Atende e marca por telefone, 24/7, sem sobrecarregar a receção.',
                'Responde e confirma marcações no WhatsApp.',
                'Liga o agente ao software de agenda que já usam.',
            ], 'flows' => [
                ['id' => 'agente-voz', 'steps' => ['Paciente liga para marcar consulta', 'Agente de voz percebe o pedido', 'Consulta a agenda da clínica', 'Consulta marcada e confirmação enviada']],
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
        $sector = preg_match('/clinica/', $all) ? 'Clínica dentária' : (preg_match('/loja/', $all) ? 'Loja online' : (preg_match('/restaurante/', $all) ? 'Restauração' : 'Serviços'));
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

/** @return array{0:string,1:string,2:?array} mime, áudio, usage */
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
                return ['audio/wav', pcm_to_wav(base64_decode($p['inlineData']['data']), $rate), gemini_usage($res['usageMetadata'] ?? null, true)];
            }
        }
        throw new RuntimeException('tts', 502);
    }
    if ($cfg['provider'] === 'openai') {
        $audio = http_post('https://api.openai.com/v1/audio/speech', ['Authorization: Bearer ' . $cfg['key']], [
            'model' => $cfg['ttsModel'], 'voice' => $cfg['voice'], 'input' => $text, 'instructions' => tts_style($lang), 'response_format' => 'mp3',
        ], $cfg['timeout']);
        return ['audio/mpeg', $audio, null]; // sem usage no endpoint de voz → cobra-se o pior caso reservado
    }
    // mock: 0,6 s de tom suave
    $rate = 24000;
    $n = (int) ($rate * 0.6);
    $pcm = '';
    for ($i = 0; $i < $n; $i++) $pcm .= pack('v', (int) round(sin(2 * M_PI * 440 * $i / $rate) * 2500 * min(1, ($n - $i) / 2000)) & 0xFFFF);
    $len = mb_strlen($text);
    return ['audio/wav', pcm_to_wav($pcm, $rate), ['inText' => (int) ceil($len / 4) + 20, 'inAudio' => 0, 'outText' => 0, 'outAudio' => (int) ceil($len / 15 * 25)]];
}

/** @return array{0:string,1:?array} texto, usage */
function do_stt(array $cfg, string $audio, string $mime): array
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
        $text = trim(implode('', array_map(fn($p) => $p['text'] ?? '', $res['candidates'][0]['content']['parts'] ?? [])));
        return [$text, gemini_usage($res['usageMetadata'] ?? null)];
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
        $u = $res['usage'] ?? null;
        $usage = isset($u['input_tokens']) ? ['inText' => (int) ($u['input_token_details']['text_tokens'] ?? 0),
            'inAudio' => (int) ($u['input_token_details']['audio_tokens'] ?? $u['input_tokens']), 'outText' => (int) ($u['output_tokens'] ?? 0), 'outAudio' => 0] : null;
        return [trim((string) ($res['text'] ?? '')), $usage];
    }
    return ['Tenho uma loja online e perdemos muito tempo a responder a mensagens de clientes',
        ['inText' => 30, 'inAudio' => (int) ceil(strlen($audio) / 4000 * 32), 'outText' => 25, 'outAudio' => 0]];
}
