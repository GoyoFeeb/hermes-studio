// HeaderBlock.tsx — Módulo de cabecera con logo centrado sobre fondo morado
// type: "header"
// Rediseñado: fondo morado profundo (#6B2C5F), logo centrado, padding generoso

import * as React from 'react';
import { Section, Img } from '@react-email/components';
import type { ImageData, ModuleSettings } from './types';
import { getSectionStyles, getImageStyles, BRAND } from './styles';

interface HeaderBlockProps {
  image?: ImageData;
  settings?: ModuleSettings;
}

export const HeaderBlock: React.FC<HeaderBlockProps> = ({ image, settings }) => {
  if (!image?.src) return null;

  return (
    <Section
      style={{
        ...getSectionStyles(settings),
        backgroundColor: settings?.backgroundColor || BRAND.purple,
        padding: settings?.padding || '20px 24px',
        textAlign: 'center',
      }}
    >
      <table border={0} cellPadding={0} cellSpacing={0} role="presentation" width="100%">
        <tbody>
          <tr>
            <td align="center">
              <Img
                src={image.src}
                alt={image.alt || 'Para y Compara — comparador de tarifas'}
                width={image.width || 200}
                height={image.height || 55}
                style={{
                  ...getImageStyles(image),
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
};

export default HeaderBlock;