import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientAbout from "./ClientAbout";

// Interface for about data from server
interface AboutServerData {
  about_title: string;
  about_subtitle: string;
  about_sections: any[];
}

// Default values for fallback
const fallbackAboutData: AboutServerData = {
  about_title: "Tentang PT Brilian Eka Saetama",
  about_subtitle:
    "Kami adalah perusahaan yang berfokus pada solusi keamanan dan proteksi kebakaran untuk bisnis dan properti.",
  about_sections: [],
};

// Function to fetch about data from Firestore Admin
async function getAboutData(language: string): Promise<AboutServerData> {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackAboutData;
  }

  try {
    // Create object to store all about data
    const aboutData: AboutServerData = { ...fallbackAboutData };
    const fields = ["about_title", "about_subtitle", "about_sections"];

    // Fetch data for each field
    const fetchPromises = fields.map(async (field) => {
      try {
        if (!adminFirestore) {
          console.error("Admin Firestore is not available");
          return;
        }
        const docSnapshot = await adminFirestore
          .collection("about")
          .doc(field)
          .get();

        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data && data[language]) {
            aboutData[field] = data[language];
          }
        }
      } catch (error) {
        console.error(`Error fetching ${field}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    console.log("About data fetched from server:", aboutData);
    return aboutData;
  } catch (error) {
    console.error("Error fetching about data:", error);
    return fallbackAboutData;
  }
}

export default async function ServerAbout() {
  // Detect language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const aboutData = await getAboutData(locale);

    // Pass data to client component
    return <ClientAbout initialData={aboutData} initialLanguage={locale} />;
  } catch (error) {
    console.error("Error in ServerAbout:", error);
    return (
      <ClientAbout initialData={fallbackAboutData} initialLanguage={locale} />
    );
  }
}
