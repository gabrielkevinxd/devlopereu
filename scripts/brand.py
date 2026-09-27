"""Gera os assets de marca a partir do logótipo REAL da DevloperEU.

Fontes (em scripts/brand-src/):
  - logo-imgur-gold.png   -> https://i.imgur.com/VDqPzzx.png (usado no header do site antigo, já com alpha)
  - logo-imgur-light.png  -> https://i.imgur.com/lwoK4d2.png (usado no rodapé do site antigo, wordmark claro)
  - logo-stacked-white.png-> captura "Captura de tela 2026-03-19 055143.png" (fundo branco)

Uso: python scripts/brand.py          (requer Pillow >= 11.2 com AVIF)
     python scripts/brand.py deep     (só a variante dourado-escuro para fundo claro)
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "scripts" / "brand-src"
OUT = ROOT / "public" / "brand"
PUB = ROOT / "public"
OUT.mkdir(parents=True, exist_ok=True)

INK = (8, 7, 5, 255)  # preto quente usado como fundo dos ícones


def trim(im: Image.Image, pad: int = 0) -> Image.Image:
    box = im.split()[3].getbbox()
    im = im.crop(box)
    if pad:
        canvas = Image.new("RGBA", (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
        canvas.paste(im, (pad, pad))
        im = canvas
    return im


def remove_white(im: Image.Image, k: float = 70.0) -> Image.Image:
    """'Colour to alpha' contra branco, sem halos.

    alpha = (255 - min(r,g,b)) / k  (saturado a 1 no núcleo dourado);
    a cor da borda é des-multiplicada: F = (C - (1-a)*255) / a, de forma
    que composto sobre branco reproduz exatamente o original e sobre preto
    não deixa franja clara.
    """
    im = im.convert("RGB")
    px = im.load()
    out = Image.new("RGBA", im.size)
    po = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            a = min(1.0, (255 - min(r, g, b)) / k)
            if a <= 0.02:
                po[x, y] = (0, 0, 0, 0)
                continue
            f = [max(0, min(255, round((c - (1 - a) * 255) / a))) for c in (r, g, b)]
            po[x, y] = (f[0], f[1], f[2], round(a * 255))
    return out


def save_all(im: Image.Image, name: str, widths: list[int]) -> None:
    """PNG master + WebP/AVIF responsivos (srcset)."""
    im.save(OUT / f"{name}.png", optimize=True)
    for w in widths:
        if w > im.width:
            continue
        h = round(im.height * w / im.width)
        r = im.resize((w, h), Image.LANCZOS)
        r.save(OUT / f"{name}-{w}.webp", quality=88, method=6)
        r.save(OUT / f"{name}-{w}.avif", quality=70)
        r.save(OUT / f"{name}-{w}.png", optimize=True)
    print(name, im.size)


def icon(mark: Image.Image, size: int, fill: float, bg=INK) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), bg)
    m = mark.copy()
    m.thumbnail((round(size * fill), round(size * fill)), Image.LANCZOS)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return canvas


ONLY_DEEP = "deep" in sys.argv[1:]


def deepen(im: Image.Image, k: float = 0.56) -> Image.Image:
    """Mesmo desenho, dourado mais escuro (x k) para fundos claros — o alpha não muda."""
    r, g, b, a = im.split()
    r, g, b = (ch.point(lambda v: round(v * k)) for ch in (r, g, b))
    return Image.merge("RGBA", (r, g, b, a))


gold = Image.open(SRC / "logo-imgur-gold.png").convert("RGBA")
light = Image.open(SRC / "logo-imgur-light.png").convert("RGBA")
stacked_white = Image.open(SRC / "logo-stacked-white.png")

if ONLY_DEEP:
    # 7) Horizontal dourado-escuro: header do tema claro (o dourado original fica fraco sobre marfim)
    save_all(deepen(trim(gold, 4)), "logo-horizontal-deep", [240, 480, 960])
    sys.exit(0)

# 1) Horizontal dourado (cabeça + wordmark dourados) — funciona em fundo escuro e claro
horiz = trim(gold, 4)
save_all(horiz, "logo-horizontal-gold", [240, 480, 960])

# 2) Horizontal para fundo escuro (cabeça dourada + wordmark claro, versão do rodapé antigo)
horiz_light = trim(light, 4)
save_all(horiz_light, "logo-horizontal-light", [240, 480, 960])

# 3) Empilhado (cabeça por cima do wordmark) com fundo removido
stacked = trim(remove_white(stacked_white), 6)
save_all(stacked, "logo-stacked-gold", [280, 560])

# 4) Símbolo (só a cabeça/rede neuronal), recortado da versão horizontal original
alpha = gold.split()[3]
bbox = alpha.getbbox()
cols = [any(alpha.getpixel((x, y)) > 8 for y in range(bbox[1], bbox[3])) for x in range(bbox[0], bbox[2])]
gap_start = None
run = 0
for i, filled in enumerate(cols):
    run = 0 if filled else run + 1
    if run >= 25:
        gap_start = bbox[0] + i - run + 1
        break
head = trim(gold.crop((bbox[0], bbox[1], gap_start, bbox[3])), 2)
save_all(head, "mark-gold", [64, 128, 285])

# 5) Favicons e ícones PWA (fundo preto, símbolo dourado)
icon(head, 512, 0.78).save(PUB / "pwa-512x512.png", optimize=True)
icon(head, 192, 0.78).save(PUB / "pwa-192x192.png", optimize=True)
icon(head, 512, 0.58).save(PUB / "pwa-maskable-512x512.png", optimize=True)  # zona segura 80%
icon(head, 180, 0.76).save(PUB / "apple-touch-icon.png", optimize=True)
fav = icon(head, 64, 0.92, bg=(0, 0, 0, 0))
fav.save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
icon(head, 32, 0.95, bg=(0, 0, 0, 0)).save(PUB / "favicon-32x32.png", optimize=True)

# 7) Horizontal dourado-escuro para fundo claro (header do tema claro)
save_all(deepen(horiz), "logo-horizontal-deep", [240, 480, 960])

# 6) Pré-visualização de controlo (compostos sobre preto e branco) — não publicada
prev = ROOT / ".verify" / "v2" / "brand"
prev.mkdir(parents=True, exist_ok=True)
for name, im in [("horiz", horiz), ("horiz-light", horiz_light), ("stacked", stacked), ("head", head)]:
    for bgname, bg in [("black", (0, 0, 0, 255)), ("white", (255, 255, 255, 255))]:
        c = Image.new("RGBA", im.size, bg)
        c.alpha_composite(im)
        c.convert("RGB").save(prev / f"{name}-on-{bgname}.png")
print("ok")
