import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientOurClients from "./ClientOurClients";

// Interface for clients data from server
interface ClientStat {
  id: number;
  value: string;
  label: string;
}

interface ClientsServerData {
  clients_title: string;
  clients_description: string;
  clients_stats: ClientStat[];
}

// Default values for fallback
const fallbackClientsData: ClientsServerData = {
  clients_title: "Dipercaya oleh Perusahaan Global",
  clients_description:
    "Kami bangga melayani klien di berbagai industri, menyediakan solusi keselamatan kebakaran berkualitas tinggi yang memenuhi kebutuhan unik dari setiap bisnis yang kami layani.",
  clients_stats: [
    { id: 2, value: "100+", label: "Proyek Selesai" },
    { id: 1, value: "98%", label: "Kepuasan Klien" },
    { id: 3, value: "10+", label: "Mitra Bisnis" },
  ],
};

// Function to fetch clients data from Firestore Admin
async function getClientsData(language: string): Promise<ClientsServerData> {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackClientsData;
  }

  try {
    // Create object to store all clients data
    const clientsData: ClientsServerData = { ...fallbackClientsData };

    // Fields to fetch from Firestore
    const fields = ["clients_data"];

    const fetchPromises = fields.map(async (field) => {
      try {
        if (!adminFirestore) {
          console.error("Admin Firestore is not available");
          return;
        }
        const docSnapshot = await adminFirestore
          .collection("clients")
          .doc(field)
          .get();

        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data && data[language]) {
            clientsData.clients_title =
              data[language].title || clientsData.clients_title;
            clientsData.clients_description =
              data[language].description || clientsData.clients_description;
            clientsData.clients_stats =
              data[language].stats || clientsData.clients_stats;
          }
        }
      } catch (error) {
        console.error(`Error fetching ${field}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    return clientsData;
  } catch (error) {
    console.error("Error fetching clients data:", error);
    return fallbackClientsData;
  }
}

export default async function ServerOurClients() {
  // Get language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const clientsData = await getClientsData(locale);

    // Pass data to client component
    return (
      <ClientOurClients initialData={clientsData} initialLanguage={locale} />
    );
  } catch (error) {
    console.error("Error in ServerOurClients:", error);
    return (
      <ClientOurClients
        initialData={fallbackClientsData}
        initialLanguage={locale}
      />
    );
  }
}
