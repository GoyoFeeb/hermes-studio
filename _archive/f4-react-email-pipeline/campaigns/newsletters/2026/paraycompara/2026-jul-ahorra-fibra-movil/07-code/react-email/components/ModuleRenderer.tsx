// ModuleRenderer.tsx — Renderizador de módulos por tipo
// Mapea cada type de módulo a su componente y renderiza con props

import * as React from 'react';
import { Section, Img, Hr, Heading, Text } from '@react-email/components';
import type { ModuleData, ContentData, ImageData, CTAData, ModuleSettings } from './types';
import { HeaderBlock } from './HeaderBlock';
import { HeroBlock } from './HeroBlock';
import { TextBlock } from './TextBlock';
import { FooterBlock } from './FooterBlock';
import { LegalBlock } from './LegalBlock';
import { CTA } from './CTA';
import { TwoColumnsBlock } from './TwoColumnsBlock';
import { ImageTextBlock } from './ImageTextBlock';
import { CardsGridBlock } from './CardsGridBlock';
import { BenefitsGridBlock } from './BenefitsGridBlock';
import { getSectionStyles, getImageStyles, getDividerStyles, getTitleStyles, getSubtitleStyles } from './styles';

// ── Componentes internos para módulos simples ──────────────────────────────

interface ImageBlockProps {
  image?: ImageData;
  settings?: ModuleSettings;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ image, settings }) => {
  if (!image?.src) return null;
  return (
    <Section style={getSectionStyles(settings)}>
      <Img
        src={image.src}
        alt={image.alt || ''}
        width={image.width || 600}
        height={image.height || 200}
        style={getImageStyles(image)}
      />
    </Section>
  );
};

interface DividerBlockProps {
  settings?: ModuleSettings;
}

const DividerBlock: React.FC<DividerBlockProps> = ({ settings }) => (
  <Section style={getSectionStyles(settings)}>
    <Hr style={getDividerStyles()} />
  </Section>
);

interface CTABlockProps {
  content?: ContentData;
  cta?: CTAData;
  settings?: ModuleSettings;
}

const CTABlock: React.FC<CTABlockProps> = ({ content, cta, settings }) => (
  <Section style={getSectionStyles(settings)}>
    {content?.title && (
      <Heading style={getTitleStyles(settings)}>{content.title}</Heading>
    )}
    {content?.subtitle && (
      <Text style={getSubtitleStyles(settings)}>{content.subtitle}</Text>
    )}
    {cta?.text && cta?.href && <CTA {...cta} />}
  </Section>
);

// ── Mapa de type → componente ──────────────────────────────────────────────

const componentMap: Record<string, React.FC<any>> = {
  header: HeaderBlock,
  hero: HeroBlock,
  'text-block': TextBlock,
  'cta-block': CTABlock,
  'image-block': ImageBlock,
  divider: DividerBlock,
  'social-proof': TextBlock,
  'two-columns': TwoColumnsBlock,
  'image-text': ImageTextBlock,
  'cards-grid': CardsGridBlock,
  'benefits-grid': BenefitsGridBlock,
  legal: LegalBlock,
  footer: FooterBlock,
};

// ── ModuleRenderer ─────────────────────────────────────────────────────────

interface ModuleRendererProps {
  module: ModuleData;
}

export const ModuleRenderer: React.FC<ModuleRendererProps> = ({ module }) => {
  // Ignorar módulos no visibles
  if (module.visible === false) return null;

  const Component = componentMap[module.type];

  if (!Component) {
    // Fallback seguro para type desconocido: no renderiza nada, no rompe
    return null;
  }

  return (
    <Component
      content={module.content}
      image={module.image}
      cta={module.cta}
      links={module.links}
      settings={module.settings}
    />
  );
};

export default ModuleRenderer;
