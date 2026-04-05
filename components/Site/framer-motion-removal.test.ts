import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const SITE_COMPONENTS_NO_FRAMER = [
  "Testimonial/ClientTestimonial.tsx",
  "OurClients/ClientOurClients.tsx",
  "Common/SectionHeader.tsx",
  "FAQ/ClientFAQ.tsx",
  "OurClientsInfo/SingleClientInfo.tsx",
  "Blog/BlogItem.tsx",
  "OurServices/SingleService.tsx",
  "Contact/ClientContact.tsx",
  "About/ClientAbout.tsx",
  "Footer/ClientFooter.tsx",
];

const OTHER_COMPONENTS_NO_FRAMER = [
  "../FeaturesTab/index.tsx",
  "../Integration/index.tsx",
];

const ERROR_PAGES_KEEP_FRAMER = [
  "../ErrorPages/Error404.tsx",
  "../ErrorPages/Error500.tsx",
  "../ErrorPages/ErrorGeneric.tsx",
];

describe("PERF-004: Framer-motion removed from site components", () => {
  describe("Site components should NOT import framer-motion", () => {
    const allNoFramer = [
      ...SITE_COMPONENTS_NO_FRAMER,
      ...OTHER_COMPONENTS_NO_FRAMER,
    ];

    for (const file of allNoFramer) {
      it(`${file} should not import framer-motion`, () => {
        const filePath = resolve(__dirname, file);
        if (existsSync(filePath)) {
          const source = readFileSync(filePath, "utf-8");
          expect(source).not.toContain('from "framer-motion"');
          expect(source).not.toContain("from 'framer-motion'");
        }
      });
    }
  });

  describe("Error pages SHOULD still use framer-motion (complex animations)", () => {
    for (const file of ERROR_PAGES_KEEP_FRAMER) {
      it(`${file} should still import framer-motion`, () => {
        const filePath = resolve(__dirname, file);
        if (existsSync(filePath)) {
          const source = readFileSync(filePath, "utf-8");
          expect(source).toContain("framer-motion");
        }
      });
    }
  });

  describe("Site components should use ScrollReveal", () => {
    for (const file of SITE_COMPONENTS_NO_FRAMER) {
      it(`${file} should use ScrollReveal`, () => {
        const filePath = resolve(__dirname, file);
        if (existsSync(filePath)) {
          const source = readFileSync(filePath, "utf-8");
          expect(source).toContain("ScrollReveal");
        }
      });
    }
  });
});
