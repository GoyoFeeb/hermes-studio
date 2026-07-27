export interface Metadata {
  campaignName: string;
  clientName: string;
  subjectLine: string;
  preheader: string;
  fromName?: string;
  fromEmail?: string;
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

export interface Image {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  borderRadius?: number;
}

export interface CTA {
  text: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontSize?: number;
  fullWidth?: boolean;
}

export interface Content {
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  items?: { text: string; author?: string; role?: string }[];
}

export interface ModuleSettings {
  backgroundColor?: string;
  padding?: string;
  textColor?: string;
  titleColor?: string;
  alignment?: 'left' | 'center' | 'right';
  borderRadius?: number;
  border?: string;
  fontSize?: number;
}

export interface Module {
  type: string;
  id: string;
  order: number;
  visible?: boolean;
  content?: Content;
  image?: Image;
  cta?: CTA;
  links?: { text: string; href: string }[];
  settings?: ModuleSettings;
}

export interface NewsletterData {
  metadata: Metadata;
  settings: NewsletterSettings;
  modules: Module[];
}
