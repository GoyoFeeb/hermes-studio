// newsletter-data.ts — Tipos y datos estructurados para la campaña Para y Compara
// Versión: 1.0.0

export interface NewsletterMetadata {
  campaignName: string;
  clientName: string;
  subjectLine: string;
  preheader: string;
  fromName: string;
  fromEmail: string;
  isTestCampaign: boolean;
  productionReady: boolean;
  version: string;
  createdAt: string;
}

export interface NewsletterSettings {
  containerWidth: number;
  backgroundColor: string;
  containerBackgroundColor: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  linkColor: string;
  borderRadius: number;
}

export interface NewsletterModule {
  id: string;
  type: string;
  order: number;
  visible?: boolean;
  content?: Record<string, any>;
  image?: Record<string, any>;
  cta?: Record<string, any>;
  links?: Array<{ text: string; href: string }>;
  settings?: Record<string, any>;
}

export interface NewsletterData {
  metadata: NewsletterMetadata;
  settings: NewsletterSettings;
  modules: NewsletterModule[];
}

const newsletterData: NewsletterData = {
  metadata: {
    campaignName: '2026-jul-ahorra-fibra-movil',
    clientName: 'Para y Compara',
    subjectLine: '¿Sigues pagando de más por tu fibra y móvil?',
    preheader: 'Compara tarifas de más de 30 compañías y encuentra una que encaje mejor contigo.',
    fromName: '[PENDIENTE — solicitar al cliente]',
    fromEmail: '[PENDIENTE — solicitar al cliente]',
    isTestCampaign: true,
    productionReady: false,
    version: '1.0.0',
    createdAt: '2026-07-09',
  },
  settings: {
    containerWidth: 600,
    backgroundColor: '#F7F0F7',
    containerBackgroundColor: '#FFFFFF',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 16,
    textColor: '#333333',
    linkColor: '#F85842',
    borderRadius: 0,
  },
  modules: [
    {
      id: 'header',
      type: 'header',
      order: 1,
      visible: true,
      content: { title: 'Para & Compara' },
      image: { src: '[PENDIENTE — LOGO_OFICIAL]', alt: 'Para y Compara', width: 180, height: 50 },
      settings: { backgroundColor: '#792771', padding: '20px 24px', textColor: '#FFFFFF', alignment: 'center' },
    },
    {
      id: 'hero',
      type: 'hero',
      order: 2,
      visible: true,
      content: {
        title: '¿Sigues pagando de más por tu fibra y móvil?',
        subtitle: 'Compara tarifas y encuentra una opción que encaje mejor contigo.',
      },
      cta: {
        text: 'COMPARAR TARIFAS',
        href: 'https://paraycompara.com/',
        backgroundColor: '#F85842',
        textColor: '#FFFFFF',
        borderRadius: 30,
        fontSize: 16,
        fullWidth: false,
      },
      settings: { backgroundColor: '#FFFFFF', padding: '40px 24px', alignment: 'center' },
    },
    {
      id: 'servicios',
      type: 'text-block',
      order: 3,
      visible: true,
      content: {
        title: 'Revisa tarifas de:',
        body: 'En Para y Compara puedes comparar todo tipo de tarifas de más de 30 compañías en un solo sitio. Rápido y sin compromiso.',
        bullets: [
          '📱 Móvil — compara datos y llamadas',
          '🌐 Fibra — velocidad y precio',
          '📱+🌐 Fibra + Móvil — paquetes combinados',
          '📺 Con Televisión — canales y plataformas',
        ],
      },
      settings: { backgroundColor: '#F7F0F7', padding: '24px', textColor: '#4A4A4A', titleColor: '#792771' },
    },
    {
      id: 'como-funciona',
      type: 'text-block',
      order: 4,
      visible: true,
      content: {
        title: 'Comparar es muy sencillo:',
        body: '**1. Selecciona** el tipo de tarifa que necesitas (móvil, fibra, o ambas).\n\n**2. Compara** precios, condiciones de permanencia, datos incluidos y cobertura.\n\n**3. Elige** la opción que mejor se ajuste a lo que buscas.',
      },
      settings: { backgroundColor: '#FFFFFF', padding: '24px', textColor: '#4A4A4A', titleColor: '#792771' },
    },
    {
      id: 'educativo',
      type: 'benefits-grid',
      order: 5,
      visible: true,
      content: {
        title: '¿Qué tener en cuenta al comparar?',
        items: [
          { title: 'Datos móviles', text: 'Revisa cuántos datos necesitas al mes. No pagues por GB que no vas a usar.' },
          { title: 'Cobertura', text: 'Asegúrate de que la operadora tiene buena cobertura en tu zona.' },
          { title: 'Paquetes combinados', text: 'Contratar móvil e Internet juntos puede ayudarte a ahorrar.' },
          { title: 'Precio y condiciones', text: 'Mira el precio mensual, la permanencia y los costes adicionales antes de decidir.' },
        ],
      },
      settings: {
        backgroundColor: '#F7F0F7', padding: '24px', textColor: '#4A4A4A', titleColor: '#792771',
        columns: 2, cardBackgroundColor: '#FFFFFF', cardBorder: '1px solid #E8D5E7', cardPadding: '16px', gap: '8px',
      },
    },
    {
      id: 'divider',
      type: 'divider',
      order: 6,
      visible: true,
      settings: { backgroundColor: '#FFFFFF', padding: '8px 24px' },
    },
    {
      id: 'cta-final',
      type: 'cta-block',
      order: 7,
      visible: true,
      content: { title: 'Empieza ahora y descubre cuánto podrías ahorrar.' },
      cta: {
        text: 'COMPARAR TARIFAS',
        href: 'https://paraycompara.com/',
        backgroundColor: '#F85842',
        textColor: '#FFFFFF',
        borderRadius: 30,
        fontSize: 16,
        fullWidth: false,
      },
      settings: { backgroundColor: '#FFFFFF', padding: '32px 24px', alignment: 'center' },
    },
    {
      id: 'footer',
      type: 'footer',
      order: 8,
      visible: true,
      content: {
        body: 'Si prefieres no recibir más emails como este, puedes darte de baja aquí.\nGestiona tus preferencias de comunicación aquí.',
      },
      links: [
        { text: 'Darse de baja', href: '[UNSUBSCRIBE_LINK]' },
        { text: 'Preferencias', href: '[PREFERENCES_LINK]' },
      ],
      settings: { backgroundColor: '#F7F0F7', padding: '20px', textColor: '#A38EA1' },
    },
    {
      id: 'legal',
      type: 'legal',
      order: 9,
      visible: true,
      content: {
        body: 'Este correo electrónico se envía a [EMAIL] porque te registraste en Para y Compara. Si quieres dejar de recibir estas comunicaciones, haz clic en el enlace de baja. Puedes actualizar tus preferencias en el enlace correspondiente.\n\n[DIRECCIÓN FÍSICA — pendiente del cliente]',
      },
      settings: { backgroundColor: '#FFFFFF', padding: '16px', textColor: '#A38EA1' },
    },
  ],
};

export default newsletterData;