// template-hermes.tsx — Plantilla React Email preparada para Hermes Agent
// El agente 07 (React Email Developer) copia/adapta este archivo a cada campana

import * as React from 'react';
import { Html, Head, Preview, Body, Container } from '@react-email/components';
import type { NewsletterData } from './components/types';
import { ModuleRenderer } from './components/ModuleRenderer';
import { getBodyStyles, getContainerStyles } from './components/styles';

// Datos por defecto (se sobreescriben cuando el agente 07 copia a la campana)
import defaultData from '../../06-data/newsletter-data.json';

interface HermesNewsletterProps {
  /** Datos de la newsletter. Si no se proporcionan, usa newsletter-data.json local */
  data?: NewsletterData;
}

/**
 * HermesNewsletter — Componente principal para Hermes Newsletter System.
 *
 * Uso:
 *   <HermesNewsletter data={newsletterData} />
 *
 * Cuando el agente 07 copia este archivo a 07-code/react-email/:
 * 1. Actualiza el import de newsletter-data.json al de la campana
 * 2. Ajusta types si es necesario
 * 3. El componente esta listo para renderizar y exportar
 */
export const HermesNewsletter: React.FC<HermesNewsletterProps> = ({ data: externalData }) => {
  const resolved = (externalData || defaultData) as NewsletterData;

  return (
    <Html>
      <Head />
      <Preview>{resolved.metadata.preheader}</Preview>
      <Body style={getBodyStyles(resolved.settings)}>
        <Container style={getContainerStyles(resolved.settings)}>
          {resolved.modules
            .filter((mod) => mod.visible !== false)
            .sort((a, b) => a.order - b.order)
            .map((mod) => (
              <ModuleRenderer key={mod.id} module={mod} />
            ))}
        </Container>
      </Body>
    </Html>
  );
};

export default HermesNewsletter;
