// TextBlock.tsx — Bloque de texto con titular, cuerpo y bullets opcionales
// Compatible con type: "text-block" en newsletter-data.json

import * as React from 'react';
import { Section, Heading, Text, Hr } from '@react-email/components';
import type { ContentData, ModuleSettings } from './types';
import { getSectionStyles, getTitleStyles, getTextStyles, getBulletStyles, getDividerStyles } from './styles';

interface TextBlockProps {
  content?: ContentData;
  settings?: ModuleSettings;
}

export const TextBlock: React.FC<TextBlockProps> = ({ content, settings }) => {
  if (!content?.title && !content?.body && !content?.bullets?.length && !content?.subtitle) return null;

  return (
    <Section style={getSectionStyles(settings)}>
      {content?.title && (
        <Heading style={getTitleStyles(settings)}>{content.title}</Heading>
      )}
      {content?.subtitle && (
        <Text style={{ ...getTextStyles(settings), fontSize: 14, color: '#555555' }}>
          {content.subtitle}
        </Text>
      )}
      {content?.body && (
        <Text style={getTextStyles(settings)}>{content.body}</Text>
      )}
      {content?.bullets?.map((bullet, idx) => (
        <Text key={idx} style={getBulletStyles(settings)}>
          • {bullet}
        </Text>
      ))}
      {content?.items?.map((item, idx) => (
        <React.Fragment key={idx}>
          <Text style={{ ...getTextStyles(settings), marginBottom: 4, fontWeight: 600 }}>
            {item.text}
          </Text>
          {item.author && (
            <Text style={{ ...getTextStyles(settings), fontSize: 13, marginTop: 0, color: '#777777' }}>
              — {item.author}{item.role ? `, ${item.role}` : ''}
            </Text>
          )}
        </React.Fragment>
      ))}
    </Section>
  );
};

export default TextBlock;
