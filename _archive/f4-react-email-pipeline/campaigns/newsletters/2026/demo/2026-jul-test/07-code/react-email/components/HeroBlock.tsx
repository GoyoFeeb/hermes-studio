// HeroBlock.tsx — Módulo hero con imagen, titular, subtítulo y CTA opcional
// Compatible con type: "hero" en newsletter-data.json

import * as React from 'react';
import { Section, Img, Heading, Text } from '@react-email/components';
import { CTA } from './CTA';
import type { ContentData, ImageData, CTAData, ModuleSettings } from './types';
import { getSectionStyles, getTitleStyles, getSubtitleStyles, getImageStyles } from './styles';

interface HeroBlockProps {
  content?: ContentData;
  image?: ImageData;
  cta?: CTAData;
  settings?: ModuleSettings;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({ content, image, cta, settings }) => (
  <Section style={getSectionStyles(settings)}>
    {image?.src && (
      <Img
        src={image.src}
        alt={image.alt || ''}
        width={image.width || 600}
        height={image.height || 300}
        style={{ ...getImageStyles(image), marginBottom: 16 }}
      />
    )}
    {content?.title && (
      <Heading style={getTitleStyles(settings)}>{content.title}</Heading>
    )}
    {content?.subtitle && (
      <Text style={getSubtitleStyles(settings)}>{content.subtitle}</Text>
    )}
    {cta?.text && cta?.href && <CTA {...cta} />}
  </Section>
);

export default HeroBlock;
