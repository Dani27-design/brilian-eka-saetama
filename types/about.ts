export interface AboutPoint {
  id: number;
  number: string;
  title: string;
  description: string;
}

export interface AboutSection {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  points?: AboutPoint[];
  ctaText?: string;
  ctaLink?: string;
  lightImage: string;
  darkImage: string;
}
