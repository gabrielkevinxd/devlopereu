import './Logo.css';

/**
 * Logótipo REAL da DevloperEU (cabeça em rede neuronal + wordmark), servido em
 * AVIF/WebP/PNG responsivos a partir de /public/brand (gerados por scripts/brand.py).
 */
const VARIANTS = {
  horizontal: { file: 'logo-horizontal-gold', w: 1001, h: 306, widths: [240, 480, 960] },
  light: { file: 'logo-horizontal-light', w: 966, h: 306, widths: [240, 480, 960] },
  /** mesmo desenho em dourado-escuro, para fundos claros (header do tema claro) */
  deep: { file: 'logo-horizontal-deep', w: 1001, h: 306, widths: [240, 480, 960] },
  stacked: { file: 'logo-stacked-gold', w: 560, h: 486, widths: [280, 560] },
  mark: { file: 'mark-gold', w: 285, h: 302, widths: [64, 128, 285] },
} as const;

export type LogoVariant = keyof typeof VARIANTS;

interface Props {
  variant?: LogoVariant;
  /** atributo sizes do srcset, p.ex. "(min-width: 900px) 180px, 140px" */
  sizes: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export function Logo({ variant = 'horizontal', sizes, alt = 'DevloperEU', className, priority }: Props) {
  const v = VARIANTS[variant];
  const set = (ext: string) => v.widths.map((w) => `/brand/${v.file}-${w}.${ext} ${w}w`).join(', ');
  return (
    <picture className={`logo logo--${variant}${className ? ` ${className}` : ''}`}>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={`/brand/${v.file}-${v.widths[v.widths.length - 1]}.png`}
        srcSet={set('png')}
        sizes={sizes}
        width={v.w}
        height={v.h}
        alt={alt}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        {...(priority ? { fetchpriority: 'high' } : {})}
      />
    </picture>
  );
}

/** URL do PNG usado como máscara do feixe de luz (efeito «o logótipo pensa»). */
export const maskUrl = (variant: LogoVariant) => `/brand/${VARIANTS[variant].file}-${VARIANTS[variant].widths[VARIANTS[variant].widths.length - 1]}.webp`;
