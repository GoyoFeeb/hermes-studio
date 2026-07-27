// FooterBlock.tsx — Pie rediseñado: más limpio, separador sutil, links claros
// type: "footer"

import * as React from 'react';
import { Section, Text, Link, Hr } from '@react-email/components';
import type { ContentData, LinkData, ImageData, ModuleSettings } from './types';
import { getSectionStyles, getSmallTextStyles, getDividerStyles, getLinkStyles, BRAND } from './styles';

interface FooterBlockProps {
  content?: ContentData;
  links?: LinkData[];
  image?: ImageData;
  settings?: ModuleSettings;
}

export const FooterBlock: React.FC<FooterBlockProps> = ({ content, links, image, settings }) => (
  <Section
    style={{
      ...getSectionStyles(settings),
      backgroundColor: settings?.backgroundColor || BRAND.purpleBg,
      padding: settings?.padding || '28px 24px 12px',
    }}
  >
    <Hr style={getDividerStyles()} />

    {content?.body && (
      <Text
        style={{
          ...getSmallTextStyles(settings),
          color: BRAND.grayLight,
          fontSize: '12px',
          lineHeight: '1.5',
          marginBottom: '12px',
          textAlign: 'center',
          fontFamily: "'Arial', 'Helvetica', sans-serif",
        }}
      >
        {content.body}
      </Text>
    )}

    {links && links.length > 0 && (
      <table border={0} cellPadding={0} cellSpacing={0} role="presentation" width="100%">
        <tbody>
          <tr>
            <td align="center" style={{ padding: '8px 0' }}>
              {links.map((link, idx) => (
                <React.Fragment key={idx}>
                  <Link
                    href={link.href}
                    style={{
                      color: BRAND.grayLight,
                      fontSize: '12px',
                      textDecoration: 'underline',
                      fontFamily: "'Arial', 'Helvetica', sans-serif",
                    }}
                  >
                    {link.text}
                  </Link>
                  {idx < (links?.length || 0) - 1 && (
                    <span style={{ color: BRAND.grayLight, margin: '0 6px', fontSize: '12px' }}>
                      &nbsp;|&nbsp;
                    </span>
                  )}
                </React.Fragment>
              ))}
            </td>
          </tr>
        </tbody>
      </table>
    )}
  </Section>
);

export default FooterBlock;