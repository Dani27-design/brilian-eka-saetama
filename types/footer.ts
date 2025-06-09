export interface FooterLink {
  name: string;
  url: string;
}

export interface FooterLogo {
  description: string;
  contact_label: string;
  contact_email: string;
  light_logo: string;
  dark_logo: string;
}

export interface FooterQuickLinks {
  title: string;
  links: FooterLink[];
}

export interface FooterSupport {
  title: string;
  links: FooterLink[];
}

export interface FooterNewsletter {
  title: string;
  description: string;
  placeholder: string;
}

export interface FooterBottom {
  language_selector: string;
  links: FooterLink[];
  copyright: string;
  social_media: FooterLink[];
}

export interface Footer {
  logo: FooterLogo;
  quick_links: FooterQuickLinks;
  support: FooterSupport;
  newsletter: FooterNewsletter;
  bottom: FooterBottom;
}
