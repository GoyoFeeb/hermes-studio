// TwoColumnsBlock.tsx — Dos columnas de contenido con imagen, texto y CTA opcional
// type: "two-columns"

import * as React from 'react';
import { Section, Row, Column, Img, Heading, Text } from '@react-email/components';
import type { ContentItemData, ModuleSettings } from './types';
import { CTA } from './CTA';
import { getSectionStyles, getTitleStyles, getTextStyles, getImageStyles } from './styles';

interface TwoColumnsBlockProps {
  content?: { title?: string; items?: ContentItemData[] };
  settings?: ModuleSettings;
}

export const TwoColumnsBlock: React.FC<TwoColumnsBlockProps> = ({ content, settings }) => {
  if (!content?.items?.length) {
    // Fallback a mostrar solo el título si no hay items
    if (content?.title) {
      return (
        <Section style={getSectionStyles(settings)}>
          <Heading style={getTitleStyles(settings)}>{content.title}</Heading>
        </Section>
      );
    }
    return null;
  }

  const items = content.items.slice(0, 2); // máximo 2 columnas
  const colWidth = 50; // 50% cada columna

  return (
    <Section style={getSectionStyles(settings)}>
      {content?.title && (
        <Heading style={{ ...getTitleStyles(settings), marginBottom: 20 }}>
          {content.title}
        </Heading>
      )}
      <Row>
        {items.map((item, idx) => (
          <Column key={idx} style={{ width: `${colWidth}%`, verticalAlign: 'top', padding: '0 8px' }}>
            {item.image?.src && (
              <Img
                src={item.image.src}
                alt={item.image.alt || ''}
                width={item.image.width || 260}
                height={item.image.height || 180}
                style={{ ...getImageStyles(item.image), marginBottom: 8 }}
              />
            )}
            {item.title && (
              <Heading style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: settings?.titleColor || '#1A1A1A' }}>
                {item.title}
              </Heading>
            )}
            {item.text && (
              <Text style={getTextStyles(settings)}>{item.text}</Text>
            )}
            {item.cta?.text && item.cta?.href && (
              <CTA {...item.cta} />
            )}
          </Column>
        ))}
      </Row>
    </Section>
  );
};

export default TwoColumnsBlock;
