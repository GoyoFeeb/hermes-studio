// BenefitsGridBlock.tsx — Grid compacto para lista de beneficios (icono + título + texto)
// type: "benefits-grid"
// Soporta settings.columns: 2 | 3 (por defecto 2)

import * as React from 'react';
import { Section, Row, Column, Img, Heading, Text } from '@react-email/components';
import type { ContentItemData, ModuleSettings } from './types';
import { getSectionStyles, getTextStyles, getImageStyles } from './styles';

interface BenefitsGridBlockProps {
  content?: { title?: string; items?: ContentItemData[] };
  settings?: ModuleSettings;
}

export const BenefitsGridBlock: React.FC<BenefitsGridBlockProps> = ({ content, settings }) => {
  if (!content?.items?.length) return null;

  const columns = Math.min(Math.max(settings?.columns || 2, 2), 3);
  const items = content.items;
  const rows: ContentItemData[][] = [];

  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <Section style={getSectionStyles(settings)}>
      {content?.title && (
        <Heading style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px', textAlign: settings?.alignment || 'center', color: settings?.titleColor || '#1A1A1A' }}>
          {content.title}
        </Heading>
      )}
      {rows.map((row, rowIdx) => (
        <Row key={rowIdx} style={{ marginBottom: rowIdx < rows.length - 1 ? 12 : 0 }}>
          {row.map((item, colIdx) => {
            const colWidth = Math.floor(100 / columns);
            return (
              <Column
                key={colIdx}
                style={{
                  width: `${colWidth}%`,
                  verticalAlign: 'top',
                  padding: colIdx < row.length - 1 ? '0 10px 0 0' : 0,
                  textAlign: 'center',
                }}
              >
                {item.image?.src && (
                  <Img
                    src={item.image.src}
                    alt={item.image.alt || ''}
                    width={item.image.width || 48}
                    height={item.image.height || 48}
                    style={{ ...getImageStyles(item.image), margin: '0 auto 6px', display: 'block' }}
                  />
                )}
                {item.title && (
                  <Text style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: settings?.titleColor || '#1A1A1A', lineHeight: '1.3' }}>
                    {item.title}
                  </Text>
                )}
                {item.text && (
                  <Text style={{ fontSize: 13, margin: '0 0 4px', color: settings?.textColor || '#555555', lineHeight: '1.4' }}>
                    {item.text}
                  </Text>
                )}
              </Column>
            );
          })}
        </Row>
      ))}
    </Section>
  );
};

export default BenefitsGridBlock;
