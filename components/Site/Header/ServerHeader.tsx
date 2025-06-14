import { cookies } from "next/headers";
import ClientHeader from "./ClientHeader";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";

const fallbackHeaderData = {
  menu_items: [],
  logo: {
    dark: "/images/logo/logo-dark.png",
    light: "/images/logo/logo-light.png",
  },
  language_dropdown: {
    en_text: "🇬🇧 English",
    id_text: "🇮🇩 Indonesia",
  },
};

async function getHeaderData(language: string) {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackHeaderData;
  }

  try {
    const headerData = {
      menu_items: [] as any[],
      logo: {
        dark: "/images/logo/logo-dark.png",
        light: "/images/logo/logo-light.png",
      },
      language_dropdown: {
        en_text: "🇬🇧 English",
        id_text: "🇮🇩 Indonesia",
      },
    };

    const menuItemsSnapshot = await adminFirestore
      .collection("header")
      .doc("menu_items")
      .get();
    if (menuItemsSnapshot.exists) {
      headerData.menu_items = menuItemsSnapshot.data()?.[language] || [];
    }

    const logoSnapshot = await adminFirestore
      .collection("header")
      .doc("logo_data")
      .get();
    if (logoSnapshot.exists) {
      const logoData = logoSnapshot.data();
      if (
        logoData &&
        typeof logoData.dark === "string" &&
        typeof logoData.light === "string"
      ) {
        headerData.logo = {
          dark: logoData.dark,
          light: logoData.light,
        };
      }
    }

    const langDropdownSnapshot = await adminFirestore
      .collection("header")
      .doc("language_dropdown")
      .get();
    if (langDropdownSnapshot.exists) {
      const langData = langDropdownSnapshot.data();
      if (langData) {
        headerData.language_dropdown = {
          en_text: langData.en_text || "🇬🇧 English",
          id_text: langData.id_text || "🇮🇩 Indonesia",
        };
      }
    }

    return headerData;
  } catch (error) {
    console.error("Error fetching header data:", error);
    return fallbackHeaderData;
  }
}

export default async function ServerHeader() {
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    const headerData = await getHeaderData(locale);
    return <ClientHeader initialData={headerData} initialLanguage={locale} />;
  } catch (error) {
    console.error("Error in ServerHeader:", error);
    return (
      <ClientHeader initialData={fallbackHeaderData} initialLanguage={locale} />
    );
  }
}
