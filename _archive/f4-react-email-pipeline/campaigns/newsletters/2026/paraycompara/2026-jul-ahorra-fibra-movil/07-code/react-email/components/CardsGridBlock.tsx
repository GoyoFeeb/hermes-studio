// CardsGridBlock.tsx — Grid de cards rediseñado con estilo landing Para y Compara
// type: "cards-grid"
// Cards redondeadas (16px), borde lavanda, icono arriba, microflecha opcional

import * as React from 'react';
import { Section, Row, Column, Img, Heading, Text } from '@react-email/components';
import type { ContentItemData, ModuleSettings } from './types';
import { getSectionStyles, getTextStyles, getImageStyles, BRAND } from './styles';

interface CardsGridBlockProps {
  content?: { title?: string; items?: ContentItemData[] };
  settings?: ModuleSettings;
}

const cardWrapperStyles: React.CSSProperties = {
  border: `1px solid ${BRAND.purpleBorder}`,
  borderRadius: 16,
  padding: '24px 20px 20px',
  marginBottom: 12,
  backgroundColor: BRAND.white,
};

export const CardsGridBlock: React.FC<CardsGridBlockProps> = ({ content, settings }) => {
  if (!content?.items?.length) return null;

  const columns = Math.min(Math.max(settings?.columns || 2, 2), 3);
  const items = content.items;
  const rows: ContentItemData[][] = [];

  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  return (
    <Section
      style={{
        ...getSectionStyles(settings),
        backgroundColor: settings?.backgroundColor || BRAND.purpleBg,
        padding: settings?.padding || '40px 24px',
      }}
    >
      {content?.title && (
        <Heading
          style={{
            color: settings?.titleColor || BRAND.dark,
            fontSize: '24px',
            fontWeight: 700,
            lineHeight: '1.3',
            marginBottom: '24px',
            textAlign: 'center',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
          }}
        >
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
                  padding: colIdx < row.length - 1 ? '0 8px 0 0' : 0,
                }}
              >
                <table cellPadding={0} cellSpacing={0} style={{
                  ...cardWrapperStyles,
                  ...(settings?.cardBackgroundColor ? { backgroundColor: settings.cardBackgroundColor } : {}),
                  ...(settings?.cardBorder ? { border: settings.cardBorder } : {}),
                  ...(settings?.cardPadding ? { padding: settings.cardPadding } : {}),
                }} width="100%">
                  <tbody>
                    <tr>
                      <td style={{ padding: 0 }}>
                        {/* Icono */}
                        {item.image?.src && (
                          <table cellPadding={0} cellSpacing={0} style={{ marginBottom: 12 }}>
                            <tbody>
                              <tr>
                                <td style={{
                                  backgroundColor: BRAND.purpleBg,
                                  borderRadius: 12,
                                  padding: '10px',
                                  lineHeight: 0,
                                }}>
                                  <Img
                                    src={item.image.src}
                                    alt={item.image.alt || ''}
                                    width={item.image.width || 48}
                                    height={item.image.height || 48}
                                    style={{
                                      display: 'block',
                                      width: item.image.width || 48,
                                      height: item.image.height || 48,
                                      outline: 'none',
                                      border: 'none',
                                    }}
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                        {/* Título */}
                        {item.title && (
                          <Heading
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              margin: '0 0 6px',
                              color: settings?.titleColor || BRAND.purpleLight,
                              fontFamily: "'Arial', 'Helvetica', sans-serif",
                            }}
                          >
                            {item.title}
                          </Heading>
                        )}
                        {/* Texto */}
                        {item.text && (
                          <Text
                            style={{
                              ...getTextStyles(settings),
                              fontSize: 14,
                              lineHeight: '1.5',
                              margin: '0 0 4px',
                              color: BRAND.gray,
                            }}
                          >
                            {item.text}
                          </Text>
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