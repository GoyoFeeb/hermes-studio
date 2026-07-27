// HeroBlock.tsx — Módulo hero con etiqueta, titular, subtítulo y CTA
// type: "hero"
// El color del eyebrow se inyecta vía settings.textColor, no está hardcodeado

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

const DEFAULT_EYEBROW_COLOR = '#4A4A4A';

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
    {/* Eyebrow label from content.bullets[0] */}
    {content?.bullets?.[0] && (
      <Text style={{
        fontFamily: "'Arial', 'Helvetica', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: settings?.textColor || DEFAULT_EYEBROW_COLOR,
        marginBottom: 12,
        textAlign: (settings?.alignment || 'left') as any,
      }}>
        {content.bullets[0]}
      </Text>
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