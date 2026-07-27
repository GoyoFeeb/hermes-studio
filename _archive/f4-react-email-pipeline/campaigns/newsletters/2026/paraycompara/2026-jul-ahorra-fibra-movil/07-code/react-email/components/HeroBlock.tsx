// HeroBlock.tsx — Hero rediseñado con estilo landing Para y Compara
// type: "hero"
// Mejora: badge superior, titular grande, subtítulo espaciado, CTA píldora

import * as React from 'react';
import { Section, Heading, Text } from '@react-email/components';
import { CTA } from './CTA';
import type { ContentData, ImageData, CTAData, ModuleSettings } from './types';
import { getSectionStyles, BRAND } from './styles';

interface HeroBlockProps {
  content?: ContentData;
  image?: ImageData;
  cta?: CTAData;
  settings?: ModuleSettings;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({ content, image, cta, settings }) => (
  <Section
    style={{
      ...getSectionStyles(settings),
      backgroundColor: settings?.backgroundColor || BRAND.white,
      padding: settings?.padding || '48px 32px 44px',
    }}
  >
    {/* Eyebrow / badge */}
    {content?.bullets?.[0] && (
      <Text
        style={{
          fontFamily: "'Arial', 'Helvetica', sans-serif",
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          color: BRAND.purpleLight,
          marginBottom: '16px',
          textAlign: (settings?.alignment || 'center') as any,
        }}
      >
        {content.bullets[0]}
      </Text>
    )}
    {/* Titular principal */}
    {content?.title && (
      <Heading
        style={{
          color: BRAND.dark,
          fontSize: '28px' as any,
          fontWeight: 700,
          lineHeight: '1.25',
          marginBottom: '16px',
          textAlign: (settings?.alignment || 'center') as any,
          fontFamily: "'Arial', 'Helvetica', sans-serif",
        }}
      >
        {content.title}
      </Heading>
    )}
    {/* Subtítulo */}
    {content?.subtitle && (
      <Text
        style={{
          color: BRAND.gray,
          fontSize: '16px',
          fontWeight: 400,
          lineHeight: '1.6',
          marginBottom: '28px',
          textAlign: (settings?.alignment || 'center') as any,
          fontFamily: "'Arial', 'Helvetica', sans-serif",
        }}
      >
        {content.subtitle}
      </Text>
    )}
    {/* CTA */}
    {cta?.text && cta?.href && <CTA {...cta} />}
  </Section>
);

export default HeroBlock;