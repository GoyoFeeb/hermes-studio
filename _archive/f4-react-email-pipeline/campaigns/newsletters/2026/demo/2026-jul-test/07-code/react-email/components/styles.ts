// styles.ts — Funciones de estilo compartidas para componentes React Email
// Cada función devuelve un objeto React.CSSProperties

import type { ModuleSettings, ImageData } from './types';

export function getSectionStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    backgroundColor: settings?.backgroundColor || '#FFFFFF',
    padding: settings?.padding || '24px',
    borderRadius: settings?.borderRadius ?? 0,
    textAlign: settings?.textAlign || 'left',
  };
}

export function getTitleStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    color: settings?.textColor || '#1A1A1A',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: '1.3',
    marginBottom: '8px',
    textAlign: settings?.textAlign || 'left',
  };
}

export function getSubtitleStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    color: settings?.textColor || '#4A4A4A',
    fontSize: '16px',
    fontWeight: 400,
    lineHeight: '1.5',
    marginBottom: '16px',
    textAlign: settings?.textAlign || 'left',
  };
}

export function getTextStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    color: settings?.textColor || '#333333',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '12px',
    textAlign: settings?.textAlign || 'left',
  };
}

export function getSmallTextStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    color: settings?.textColor || '#888888',
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
    color: textColor || '#2563EB',
    fontSize: '13px',
    textDecoration: 'underline',
    marginRight: '8px',
  };
}

export function getDividerStyles(): React.CSSProperties {
  return {
    borderColor: '#E0E0E0',
    marginTop: '16px',
    marginBottom: '16px',
  };
}

export function getButtonStyles(cta?: { backgroundColor?: string; textColor?: string; borderRadius?: number; fontSize?: number; fullWidth?: boolean }): React.CSSProperties {
  return {
    backgroundColor: cta?.backgroundColor || '#2563EB',
    color: cta?.textColor || '#FFFFFF',
    borderRadius: cta?.borderRadius ?? 4,
    fontSize: cta?.fontSize ?? 14,
    padding: '12px 24px',
    textDecoration: 'none',
    display: 'inline-block',
    fontWeight: 600,
    textAlign: 'center',
    width: cta?.fullWidth ? '100%' : undefined,
  };
}

export function getBulletStyles(): React.CSSProperties {
  return {
    fontSize: '14px',
    color: '#4A4A4A',
    paddingLeft: '20px',
    marginBottom: '6px',
    lineHeight: '1.5',
  };
}

export function getBodyStyles(settings?: ModuleSettings): React.CSSProperties {
  return {
    backgroundColor: settings?.backgroundColor || '#F4F4F4',
    fontFamily: "'Arial', 'Helvetica', sans-serif",
    padding: '0',
    margin: '0',
  };
}

export function getContainerStyles(settings?: { containerWidth?: number }): React.CSSProperties {
  return {
    maxWidth: settings?.containerWidth || 600,
    margin: '0 auto',
    backgroundColor: '#FFFFFF',
  };
}
