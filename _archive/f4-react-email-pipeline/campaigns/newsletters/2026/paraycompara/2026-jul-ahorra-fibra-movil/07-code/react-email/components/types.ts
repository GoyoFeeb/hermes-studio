// types.ts — Tipos compartidos para los componentes React Email

export interface ModuleSettings {
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  borderRadius?: number;
  columns?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ContentData {
  title?: string;
  subtitle?: string;
  body?: string;
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

export interface ContentItemData {
  title?: string;
  text?: string;
  body?: string;
  image?: ImageData;
  cta?: CTAData;
}

export interface ModuleData {
  type: string;
  visible?: boolean;
  content?: ContentData;
  image?: ImageData;
  cta?: CTAData;
  links?: LinkData[];
  settings?: ModuleSettings;
}