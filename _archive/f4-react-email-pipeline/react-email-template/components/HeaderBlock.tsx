// HeaderBlock.tsx — Módulo de cabecera con logo
// Compatible con type: "header" en newsletter-data.json

import * as React from 'react';
import { Section, Img } from '@react-email/components';
import type { ImageData, ModuleSettings } from './types';
import { getSectionStyles, getImageStyles } from './styles';

interface HeaderBlockProps {
  image?: ImageData;
  settings?: ModuleSettings;
}

export const HeaderBlock: React.FC<HeaderBlockProps> = ({ image, settings }) => {
  if (!image?.src) return null;

  return (
    <Section style={getSectionStyles(settings)}>
      <Img
        src={image.src}
        alt={image.alt || ''}
        width={image.width || 200}
        height={image.height || 60}
        style={getImageStyles(image)}
      />
    </Section>
  );
};

export default HeaderBlock;
