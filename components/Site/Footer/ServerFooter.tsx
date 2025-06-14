import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientFooter from "./ClientFooter";

// Default values for footer data
const fallbackFooterData = {
  logo: {
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    contact_label: "contact",
    contact_email: "hello@solid.com",
    light_logo: "/images/logo/logo-light.png",
    dark_logo: "/images/logo/logo-dark.png",
  },
  quick_links: {
    title: "Quick Links",
    links: [
      { name: "Home", url: "#" },
      { name: "Product", url: "#" },
      { name: "Careers", url: "#" },
      { name: "Pricing", url: "#" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { name: "Company", url: "#" },
      { name: "Press media", url: "#" },
      { name: "Our Blog", url: "#" },
      { name: "Contact Us", url: "#" },
    ],
  },
  newsletter: {
    title: "Newsletter",
    description: "Subscribe to receive future updates",
    placeholder: "Email address",
  },
  bottom: {
    language_selector: "English",
    links: [
      { name: "Privacy Policy", url: "#" },
      { name: "Support", url: "#" },
    ],
    copyright: `© ${new Date().getFullYear()} Solid. All rights reserved`,
    social_media: [
      { name: "Facebook", url: "#" },
      { name: "Twitter", url: "#" },
      { name: "LinkedIn", url: "#" },
      { name: "Behance", url: "#" },
    ],
  },
};

// Function to fetch footer data from Firestore Admin
async function getFooterData(language: string) {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackFooterData;
  }

  try {
    // Initialize with default data
    const footerData = { ...fallbackFooterData };

    // Fetch logo data
    const logoSnapshot = await adminFirestore
      .collection("footer")
      .doc("main")
      .get();
    if (logoSnapshot.exists) {
      const logoData = logoSnapshot.data();
      if (logoData && logoData[language]?.logo) {
        footerData.logo = {
          ...footerData.logo,
          ...logoData[language]?.logo,
        };
      }
    }

    // Fetch quick links data
    const quickLinksSnapshot = await adminFirestore
      .collection("footer")
      .doc("main")
      .get();
    if (quickLinksSnapshot.exists) {
      const quickLinksData = quickLinksSnapshot.data();
      if (quickLinksData && quickLinksData[language]?.quick_links) {
        footerData.quick_links = quickLinksData[language]?.quick_links;
      }
    }

    // Fetch support data
    const supportSnapshot = await adminFirestore
      .collection("footer")
      .doc("main")
      .get();
    if (supportSnapshot.exists) {
      const supportData = supportSnapshot.data();
      if (supportData && supportData[language]?.support) {
        footerData.support = supportData[language]?.support;
      }
    }

    // Fetch newsletter data
    const newsletterSnapshot = await adminFirestore
      .collection("footer")
      .doc("main")
      .get();
    if (newsletterSnapshot.exists) {
      const newsletterData = newsletterSnapshot.data();
      if (newsletterData && newsletterData[language]?.newsletter) {
        footerData.newsletter = newsletterData[language]?.newsletter;
      }
    }

    // Fetch bottom data
    const bottomSnapshot = await adminFirestore
      .collection("footer")
      .doc("main")
      .get();
    if (bottomSnapshot.exists) {
      const bottomData = bottomSnapshot.data();
      if (bottomData && bottomData[language]?.bottom) {
        // Merge with existing copyright year
        footerData.bottom = {
          ...bottomData[language]?.bottom,
          copyright:
            bottomData[language]?.bottom?.copyright?.replace(
              /\d{4}/,
              new Date().getFullYear().toString(),
            ) || footerData.bottom.copyright,
        };
      }
    }

    return footerData;
  } catch (error) {
    console.error("Error fetching footer data:", error);
    return fallbackFooterData;
  }
}

export default async function ServerFooter() {
  // Get language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const footerData = await getFooterData(locale);

    // Pass data to client component
    return <ClientFooter initialData={footerData} initialLanguage={locale} />;
  } catch (error) {
    console.error("Error in ServerFooter:", error);
    return (
      <ClientFooter initialData={fallbackFooterData} initialLanguage={locale} />
    );
  }
}
