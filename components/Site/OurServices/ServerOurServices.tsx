import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientOurServices from "./ClientOurServices";

// Interface for services data from server
interface ServicesServerData {
  services_title: string;
  services_subtitle: string;
  services_data: any[];
}

// Default values for fallback
const fallbackServicesData: ServicesServerData = {
  services_title: "Kami Menyediakan Layanan Terbaik untuk Kebutuhan Anda",
  services_subtitle:
    "Pelajari lebih lanjut tentang layanan dan solusi yang kami tawarkan untuk memenuhi kebutuhan bisnis Anda.",
  services_data: [],
};

// Function to fetch services data from Firestore Admin
async function getServicesData(language: string): Promise<ServicesServerData> {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackServicesData;
  }

  try {
    // Create object to store all services data
    const servicesData: ServicesServerData = { ...fallbackServicesData };

    // Fetch title, subtitle, and data
    const fields = ["services_title", "services_subtitle", "services_data"];

    const fetchPromises = fields.map(async (field) => {
      try {
        if (!adminFirestore) {
          console.error("Admin Firestore is not available");
          return;
        }
        const docSnapshot = await adminFirestore
          .collection("services")
          .doc(field)
          .get();

        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data && data[language]) {
            servicesData[field] = data[language];
          }
        }
      } catch (error) {
        console.error(`Error fetching ${field}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    console.log("Services data fetched from server:", servicesData);
    return servicesData;
  } catch (error) {
    console.error("Error fetching services data:", error);
    return fallbackServicesData;
  }
}

export default async function ServerOurServices() {
  // Get language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const servicesData = await getServicesData(locale);

    // Pass data to client component
    return (
      <ClientOurServices initialData={servicesData} initialLanguage={locale} />
    );
  } catch (error) {
    console.error("Error in ServerOurServices:", error);
    return (
      <ClientOurServices
        initialData={fallbackServicesData}
        initialLanguage={locale}
      />
    );
  }
}
