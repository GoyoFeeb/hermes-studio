// styles.ts — Funciones de estilo compartidas para componentes React Email
// Actualizado con paleta exacta de marca Para y Compara (Julio 2026)
// Colores extraídos de la landing real: https://paraycompara.com/

import type { ModuleSettings, ImageData } from './types';

// ── Paleta de marca ─────────────────────────────────────────────────────────
export const BRAND = {
  purple: '#6B2C5F',        // Morado profundo — header, footer, badges
  purpleLight: '#7B1FA2',   // Morado claro — títulos sección, iconos
  purpleBg: '#F3E5F5',      // Lavanda muy pálido — fondos alternos
  purpleBorder: '#EDE7F3',  // Borde lavanda — cards
  orange: '#FF5A3C',        // Coral/naranja — CTA principal
  orangeHover: '#E64A2E',   // Naranja oscuro — hover CTA
  white: '#FFFFFF',         // Blanco — fondos principales, cards
  dark: '#2D2D2D',          // Casi negro — titulares
  gray: '#666666',          // Gris medio — texto cuerpo
  grayLight: '#888888',     // Gris claro — texto legal/secundario
  cardShadow: '0 2px 8px rgba(107, 44, 95, 0.08)', // Sombra sutil cards
} as const;

// ── Funciones de estilo ─────────────────────────────────────────────────────

export function getSectionStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    backgroundColor: settings?.backgroundColor || BRAND.white,
    padding: settings?.padding || '32px 24px',
    borderRadius: settings?.borderRadius ?? 0,
    textAlign: settings?.textAlign || 'left',
  };
}

export function getTitleStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    color: settings?.textColor || BRAND.dark,
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: '1.2',
    marginBottom: '8px',
    textAlign: settings?.textAlign || 'left',
  };
}

export function getSubtitleStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    color: settings?.textColor || BRAND.gray,
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '1.5',
    marginBottom: '20px',
    textAlign: settings?.textAlign || 'left',
  };
}

export function getTextStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    color: settings?.textColor || BRAND.gray,
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '12px',
    textAlign: settings?.textAlign || 'left',
  };
}

export function getSmallTextStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    color: settings?.textColor || BRAND.grayLight,
    fontSize: '12px',
    lineHeight: '1.4',
    marginBottom: '8px',
    textAlign: settings?.textAlign || 'left',
  };
}

export function getImageStyles(image?: ImageData): React.CSSProperties {
  return {
    width: image?.width || 600,
    height: image?.height || 'auto',
    maxWidth: '100%',
    display: 'block',
    outline: 'none',
    border: 'none',
    textDecoration: 'none',
  };
}

export function getLinkStyles(textColor?: string): React.CSSProperties {
  return {
    color: textColor || BRAND.grayLight,
    fontSize: '12px',
    textDecoration: 'underline',
    marginRight: '8px',
  };
}

export function getDividerStyles(): React.CSSProperties {
  return {
    borderColor: BRAND.purpleBorder,
    marginTop: '0',
    marginBottom: '12px',
  };
}

export function getButtonStyles(cta?: { backgroundColor?: string; textColor?: string; borderRadius?: number; fontSize?: number; fullWidth?: boolean }): React.CSSProperties {
  return {
    backgroundColor: cta?.backgroundColor || BRAND.orange,
    color: cta?.textColor || BRAND.white,
    borderRadius: cta?.borderRadius ?? 50,
    fontSize: cta?.fontSize ?? 16,
    padding: '16px 32px',
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: 700,
    textAlign: 'center',
    width: cta?.fullWidth ? '100%' : undefined,
  };
}

export function getBulletStyles(): React.CSSProperties {
  return {
    fontSize: '14px',
    color: BRAND.gray,
    paddingLeft: '20px',
    marginBottom: '6px',
    lineHeight: '1.5',
  };
}

export function getBodyStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    backgroundColor: settings?.backgroundColor || BRAND.purpleBg,
    fontFamily: "'Arial', 'Helvetica', sans-serif",
    padding: '0',
    margin: '0',
  };
}

export function getContainerStyles(settings?: { containerWidth?: number }): React.CSSProperties {
  return {
    maxWidth: settings?.containerWidth || 600,
    margin: '0 auto',
    backgroundColor: BRAND.white,
  };
}