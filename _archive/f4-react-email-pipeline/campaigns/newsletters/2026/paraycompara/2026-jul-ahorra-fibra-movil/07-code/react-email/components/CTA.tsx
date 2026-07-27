// CTA.tsx — Botón CTA con estilo píldora para máxima compatibilidad email
// Outlook-compatible: fondo en <td>, <a> con display:block
// Estilo píldora redondeada (border-radius: 50px), padding generoso

import * as React from 'react';
import type { CTAData } from './types';

export const CTA: React.FC<CTAData> = ({ text, href, backgroundColor, textColor, borderRadius, fontSize, fullWidth }) => {
  if (!text || !href) return null;

  const bg = backgroundColor || '#FF5A3C';
  const fg = textColor || '#FFFFFF';
  const fs = fontSize ?? 17;
  const radius = borderRadius ?? 50;
  const paddingV = 16;
  const paddingH = fullWidth ? 24 : 36;

  return (
    <table border={0} cellPadding={0} cellSpacing={0} role="presentation" width="100%" style={{ width: '100%' }}>
      <tbody>
        <tr>
          <td align="center" style={{ padding: '4px 0 0' }}>
            <table border={0} cellPadding={0} cellSpacing={0} role="presentation"
              style={{ ...(fullWidth ? { width: '100%' } : {}) }}>
              <tbody>
                <tr>
                  <td align="center"
                    style={{
                      backgroundColor: bg,
                      borderRadius: radius,
                      padding: `${paddingV}px ${paddingH}px`,
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
                        lineHeight: fs * 1.4 + 'px',
                        whiteSpace: 'nowrap',
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