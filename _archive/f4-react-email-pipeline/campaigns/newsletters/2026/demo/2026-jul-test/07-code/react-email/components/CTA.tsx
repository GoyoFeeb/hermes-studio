// CTA.tsx — Componente de botón CTA como enlace <a> con estilos inline
// Máxima compatibilidad con email: se renderiza como <a> no como <button>

import * as React from 'react';
import { Button } from '@react-email/components';
import type { CTAData } from './types';
import { getButtonStyles } from './styles';

export const CTA: React.FC<CTAData> = ({ text, href, backgroundColor, textColor, borderRadius, fontSize, fullWidth }) => {
  if (!text || !href) return null;

  const styles = getButtonStyles({
    text,
    href,
    backgroundColor,
    textColor,
    borderRadius,
    fontSize,
    fullWidth,
  });

  return (
    <Button href={href} style={{
      ...styles,
      ...(fullWidth ? { display: 'block', width: '100%' } : {}),
    }}>
      {text}
    </Button>
  );
};

export default CTA;
