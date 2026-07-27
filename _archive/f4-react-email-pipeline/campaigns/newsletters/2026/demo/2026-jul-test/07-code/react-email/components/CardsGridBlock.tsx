// CardsGridBlock.tsx — Grid de cards con imagen, título, texto y CTA opcional
// type: "cards-grid"
// Soporta settings.columns: 2 | 3 (por defecto 2)

import * as React from 'react';
import { Section, Row, Column, Img, Heading, Text } from '@react-email/components';
import type { ContentItemData, ModuleSettings } from './types';
import { CTA } from './CTA';
import { getSectionStyles, getTitleStyles, getTextStyles, getImageStyles } from './styles';

interface CardsGridBlockProps {
  content?: { title?: string; items?: ContentItemData[] };
  settings?: ModuleSettings;
}

const cardBaseStyles: React.CSSProperties = {
  border: '1px solid #E0E0E0',
  borderRadius: 6,
  padding: '16px',
  marginBottom: 12,
  backgroundColor: '#FFFFFF',
};

export const CardsGridBlock: React.FC<CardsGridBlockProps> = ({ content, settings }) => {
  if (!content?.items?.length) return null;

  const columns = Math.min(Math.max(settings?.columns || 2, 2), 3);
  const items = content.items;
  const rows: ContentItemData[][] = [];

  // Agrupar items en filas de `columns` elementos
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <Section style={getSectionStyles(settings)}>
      {content?.title && (
        <Heading style={{ ...getTitleStyles(settings), marginBottom: 20 }}>
          {content.title}
        </Heading>
      )}
      {rows.map((row, rowIdx) => (
        <Row key={rowIdx} style={{ marginBottom: rowIdx < rows.length - 1 ? 8 : 0 }}>
          {row.map((item, colIdx) => {
            const colWidth = Math.floor(100 / columns);
            return (
              <Column
                key={colIdx}
                style={{
                  width: `${colWidth}%`,
                  verticalAlign: 'top',
                  padding: colIdx < row.length - 1 ? '0 6px 0 0' : 0,
                }}
              >
                <table cellPadding={0} cellSpacing={0} style={{
                      ...cardBaseStyles,
                      ...(settings?.cardBackgroundColor ? { backgroundColor: settings.cardBackgroundColor } : {}),
                      ...(settings?.cardBorder ? { border: settings.cardBorder } : {}),
                      ...(settings?.cardPadding ? { padding: settings.cardPadding } : {}),
                    }} width="100%">
                  <tbody>
                    <tr>
                      <td style={{ padding: 0 }}>
                        {item.image?.src && (
                          <Img
                            src={item.image.src}
                            alt={item.image.alt || ''}
                            width={item.image.width || (columns === 2 ? 260 : 160)}
                            height={item.image.height || (columns === 2 ? 160 : 120)}
                            style={{ ...getImageStyles(item.image), marginBottom: 8 }}
                          />
                        )}
                        {item.title && (
                          <Heading style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: settings?.titleColor || '#1A1A1A' }}>
                            {item.title}
                          </Heading>
                        )}
                        {item.text && (
                          <Text style={{ ...getTextStyles(settings), fontSize: 14, margin: '0 0 8px' }}>
                            {item.text}
                          </Text>
                        )}
                        {item.cta?.text && item.cta?.href && (
                          <CTA {...item.cta} />
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Column>
            );
          })}
        </Row>
      ))}
    </Section>
  );
};

export default CardsGridBlock;
