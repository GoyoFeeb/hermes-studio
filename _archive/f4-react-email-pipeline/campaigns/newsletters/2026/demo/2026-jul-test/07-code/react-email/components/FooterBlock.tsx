// FooterBlock.tsx — Pie con texto legal, enlaces de preferencias y logo
// Compatible con type: "footer" en newsletter-data.json

import * as React from 'react';
import { Section, Text, Link, Hr, Img } from '@react-email/components';
import type { ContentData, LinkData, ImageData, ModuleSettings } from './types';
import { getSectionStyles, getSmallTextStyles, getDividerStyles, getLinkStyles } from './styles';

interface FooterBlockProps {
  content?: ContentData;
  links?: LinkData[];
  image?: ImageData;
  settings?: ModuleSettings;
}

export const FooterBlock: React.FC<FooterBlockProps> = ({ content, links, image, settings }) => (
  <Section style={getSectionStyles(settings)}>
    <Hr style={getDividerStyles()} />

    {image?.src && (
      <Img
        src={image.src}
        alt={image.alt || ''}
        width={image.width || 120}
        height={image.height || 40}
        style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto 12px' }}
      />
    )}

    {content?.body && (
      <Text style={getSmallTextStyles(settings)}>{content.body}</Text>
    )}

    {links?.map((link, idx) => (
      <React.Fragment key={idx}>
        <Link href={link.href} style={getLinkStyles(settings?.textColor)}>
          {link.text}
        </Link>
        {idx < (links?.length || 0) - 1 && (
          <Text style={{ ...getSmallTextStyles(settings), display: 'inline', margin: '0 4px' }}>
            &nbsp;|&nbsp;
          </Text>
        )}
      </React.Fragment>
    ))}
  </Section>
);

export default FooterBlock;
