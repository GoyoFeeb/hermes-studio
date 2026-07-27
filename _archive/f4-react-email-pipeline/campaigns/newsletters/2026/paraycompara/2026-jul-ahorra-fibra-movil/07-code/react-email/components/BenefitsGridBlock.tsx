// BenefitsGridBlock.tsx — Grid de microcards con icono, título y texto
// type: "benefits-grid"
// Rediseñado: microcards blancas sobre fondo lavanda, icono en círculo, más aire

import * as React from 'react';
import { Section, Row, Column, Img, Heading, Text } from '@react-email/components';
import type { ContentItemData, ModuleSettings } from './types';
import { getSectionStyles, getTextStyles, getImageStyles, BRAND } from './styles';

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
    <Section
      style={{
        ...getSectionStyles(settings),
        backgroundColor: settings?.backgroundColor || BRAND.white,
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
            marginBottom: '28px',
            textAlign: 'center',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
          }}
        >
          {content.title}
        </Heading>
      )}
      {rows.map((row, rowIdx) => (
        <Row key={rowIdx} style={{ marginBottom: rowIdx < rows.length - 1 ? 16 : 0 }}>
          {row.map((item, colIdx) => {
            const colWidth = Math.floor(100 / columns);
            return (
              <Column
                key={colIdx}
                style={{
                  width: `${colWidth}%`,
                  verticalAlign: 'top',
                  padding: colIdx < row.length - 1 ? '0 12px 0 0' : 0,
                }}
              >
                <table cellPadding={0} cellSpacing={0}
                  style={{
                    backgroundColor: BRAND.purpleBg,
                    borderRadius: 16,
                    padding: '20px 16px',
                    width: '100%',
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: 0, textAlign: 'center' }}>
                        {/* Icono en círculo lavanda */}
                        {item.image?.src && (
                          <table cellPadding={0} cellSpacing={0} style={{ margin: '0 auto 12px' }}>
                            <tbody>
                              <tr>
                                <td style={{
                                  backgroundColor: BRAND.white,
                                  borderRadius: 20,
                                  padding: '8px',
                                  lineHeight: 0,
                                }}>
                                  <Img
                                    src={item.image.src}
                                    alt={item.image.alt || ''}
                                    width={item.image.width || 40}
                                    height={item.image.height || 40}
                                    style={{
                                      display: 'block',
                                      width: item.image.width || 40,
                                      height: item.image.height || 40,
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
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              margin: '0 0 6px',
                              color: BRAND.dark,
                              lineHeight: '1.3',
                              textAlign: 'center',
                              fontFamily: "'Arial', 'Helvetica', sans-serif",
                            }}
                          >
                            {item.title}
                          </Text>
                        )}
                        {/* Texto */}
                        {item.text && (
                          <Text
                            style={{
                              fontSize: 13,
                              lineHeight: '1.5',
                              margin: '0',
                              color: BRAND.gray,
                              textAlign: 'center',
                              fontFamily: "'Arial', 'Helvetica', sans-serif",
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

export default BenefitsGridBlock;