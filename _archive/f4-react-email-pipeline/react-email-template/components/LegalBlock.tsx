// LegalBlock.tsx — Bloque de texto legal (disclaimers, condiciones, avisos)
// Compatible con type: "legal" en newsletter-data.json

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import type { ContentData, ModuleSettings } from './types';
import { getSectionStyles, getSmallTextStyles } from './styles';

interface LegalBlockProps {
  content?: ContentData;
  settings?: ModuleSettings;
}

export const LegalBlock: React.FC<LegalBlockProps> = ({ content, settings }) => {
  if (!content?.body && !content?.title) return null;

  return (
    <Section style={getSectionStyles(settings)}>
      {content?.title && (
        <Text style={{ ...getSmallTextStyles(settings), fontWeight: 600 }}>
          {content.title}
        </Text>
      )}
      {content?.body && (
        <Text style={getSmallTextStyles(settings)}>{content.body}</Text>
      )}
    </Section>
  );
};

export default LegalBlock;
