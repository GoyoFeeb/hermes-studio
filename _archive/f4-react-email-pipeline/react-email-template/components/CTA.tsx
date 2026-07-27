// CTA.tsx — Botón CTA limpio (VML se añade en export-html.tsx como post-procesado)
// Función: renderiza el botón estándar; el fallback Outlook se añade en exportación

import * as React from 'react';
import type { CTAData } from './types';

export const CTA: React.FC<CTAData> = ({ text, href, backgroundColor, textColor, borderRadius, fontSize, fullWidth }) => {
  if (!text || !href) return null;

  const bg = backgroundColor || '#FF5A3C';
  const fg = textColor || '#FFFFFF';
  const fs = fontSize ?? 16;
  const radius = borderRadius ?? 30;
  const px = fs * 1.4;

  return (
    <table border={0} cellPadding={0} cellSpacing={0} role="presentation" width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td align="center" style={{ padding: '0px' }}>
            <table border={0} cellPadding={0} cellSpacing={0} role="presentation"
              style={{ ...(fullWidth ? { width: '100%' } : {}) }}>
              <tbody>
                <tr>
                  <td align="center"
                    style={{
                      backgroundColor: bg,
                      borderRadius: radius,
                      padding: '14px 28px',
                    }}>
                    <a
                      href={href}
                      target="_blank"
                      style={{
                        display: 'inline-block',
                        color: fg,
                        fontFamily: "'Arial', 'Helvetica', sans-serif",
                        fontSize: fs,
                        fontWeight: 700,
                        letterSpacing: '0.5px',
                        textDecoration: 'none',
                        textAlign: 'center',
                        lineHeight: px + 'px',
                      }}>
                      {text}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default CTA;