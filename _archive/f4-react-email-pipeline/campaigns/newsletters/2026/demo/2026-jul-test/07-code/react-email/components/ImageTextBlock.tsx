// ImageTextBlock.tsx — Imagen + texto lado a lado, con posición de imagen configurable
// type: "image-text"
// Soporta settings.imagePosition: "left" | "right" (por defecto "left")

import * as React from 'react';
import { Section, Row, Column, Img, Heading, Text } from '@react-email/components';
import type { ContentData, ImageData, CTAData, ModuleSettings } from './types';
import { CTA } from './CTA';
import { getSectionStyles, getTitleStyles, getSubtitleStyles, getTextStyles, getImageStyles } from './styles';

interface ImageTextBlockProps {
  content?: ContentData;
  image?: ImageData;
  cta?: CTAData;
  settings?: ModuleSettings;
}

export const ImageTextBlock: React.FC<ImageTextBlockProps> = ({ content, image, cta, settings }) => {
  if (!image?.src && !content?.title && !content?.body) return null;

  const imagePosition = settings?.imagePosition || 'left';
  const imageCol = image?.src ? (
    <Column style={{ width: '40%', verticalAlign: 'middle', padding: imagePosition === 'left' ? '0 16px 0 0' : '0 0 0 16px' }}>
      <Img
        src={image.src}
        alt={image.alt || ''}
        width={image.width || 220}
        height={image.height || 180}
        style={{ ...getImageStyles(image), display: 'block', margin: '0 auto' }}
      />
    </Column>
  ) : null;

  const textCol = (
    <Column style={{ width: image?.src ? '60%' : '100%', verticalAlign: 'middle' }}>
      {content?.title && (
        <Heading style={{ ...getTitleStyles(settings), marginBottom: 8 }}>{content.title}</Heading>
      )}
      {content?.subtitle && (
        <Text style={getSubtitleStyles(settings)}>{content.subtitle}</Text>
      )}
      {content?.body && (
        <Text style={getTextStyles(settings)}>{content.body}</Text>
      )}
      {cta?.text && cta?.href && <CTA {...cta} />}
    </Column>
  );

  return (
    <Section style={getSectionStyles(settings)}>
      <Row>
        {imagePosition === 'left' ? (
          <>
            {imageCol}
            {textCol}
          </>
        ) : (
          <>
            {textCol}
            {imageCol}
          </>
        )}
      </Row>
    </Section>
  );
};

export default ImageTextBlock;
