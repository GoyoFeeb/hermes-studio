// types.ts — Tipos compartidos para los componentes React Email
// Fuente de verdad única para NewsletterData

export interface NewsletterMetadata {
  campaignName: string;
  clientName: string;
  subjectLine: string;
  preheader: string;
  fromName?: string;
  fromEmail?: string;
  isTestCampaign?: boolean;
  productionReady?: boolean;
  version: string;
  createdAt: string;
}

export interface NewsletterSettings {
  containerWidth: number;
  backgroundColor: string;
  containerBackgroundColor: string;
  fontFamily: string;
  fontSize?: number;
  textColor?: string;
  linkColor?: string;
  borderRadius?: number;
}

export interface ModuleSettings {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  borderRadius?: number;
  columns?: number;
  textAlign?: 'left' | 'center' | 'right';
  alignment?: 'left' | 'center' | 'right';
  titleColor?: string;
  cardBackgroundColor?: string;
  cardBorder?: string;
  cardPadding?: string;
  gap?: string;
  imagePosition?: string;
}

export interface ImageData {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface CTAData {
  text?: string;
  href?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontSize?: number;
  fullWidth?: boolean;
}

export interface LinkData {
  text?: string;
  href?: string;
}

export interface ContentData {
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  items?: ContentItemData[];
}

export interface ContentItemData {
  title?: string;
  text?: string;
  body?: string;
  image?: ImageData;
  cta?: CTAData;
  author?: string;
  role?: string;
}

export interface ModuleData {
  id: string;
  order: number;
  type: string;
  visible?: boolean;
  content?: ContentData;
  image?: ImageData;
  cta?: CTAData;
  links?: LinkData[];
  settings?: ModuleSettings;
}

export interface NewsletterData {
  metadata: NewsletterMetadata;
  settings: NewsletterSettings;
  modules: ModuleData[];
}