// LegalBlock.tsx — Bloque de texto legal
// type: "legal"

import * as React from 'react';
import { Section, Text } from '@react-email/components';
import type { ContentData, ModuleSettings } from './types';
import { getSectionStyles, getSmallTextStyles, BRAND } from './styles';

interface LegalBlockProps {
  content?: ContentData;
  settings?: ModuleSettings;
}

export const LegalBlock: React.FC<LegalBlockProps> = ({ content, settings }) => {
  if (!content?.body && !content?.title) return null;

  return (
    <Section
      style={{
        ...getSectionStyles(settings),
        backgroundColor: settings?.backgroundColor || BRAND.purpleBg,
        padding: settings?.padding || '4px 24px 28px',
      }}
    >
      {content?.body && (
        <Text
          style={{
            ...getSmallTextStyles(settings),
            color: BRAND.grayLight,
            fontSize: '11px',
            lineHeight: '1.5',
            textAlign: 'center',
            fontFamily: "'Arial', 'Helvetica', sans-serif",
          }}
        >
          {content.body}
        </Text>
      )}
    </Section>
  );
};

export default LegalBlock;