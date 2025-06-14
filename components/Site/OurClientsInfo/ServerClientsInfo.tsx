import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientClientsInfo from "./ClientClientsInfo";
import { Brand } from "@/types/brand";

// Interface for clients info data from server
interface ClientsInfoServerData {
  clients: Brand[];
}

// Default values for fallback
const fallbackClientsData: ClientsInfoServerData = {
  clients: [],
};

// Function to fetch clients info data from Firestore Admin
async function getClientsInfoData(
  language: string,
): Promise<ClientsInfoServerData> {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackClientsData;
  }

  try {
    // Create object to store clients data
    const clientsData: ClientsInfoServerData = { ...fallbackClientsData };

    // Fetch clients data
    const docSnapshot = await adminFirestore
      .collection("clientsInfo")
      .doc("clients")
      .get();

    if (docSnapshot.exists) {
      const data = docSnapshot.data();
      if (data && data[language]) {
        clientsData.clients = data[language];
      }
    }

    console.log("Clients info data fetched from server:", clientsData);
    return clientsData;
  } catch (error) {
    console.error("Error fetching clients info data:", error);
    return fallbackClientsData;
  }
}

export default async function ServerClientsInfo() {
  // Get language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const clientsData = await getClientsInfoData(locale);

    // Pass data to client component
    return (
      <ClientClientsInfo initialData={clientsData} initialLanguage={locale} />
    );
  } catch (error) {
    console.error("Error in ServerClientsInfo:", error);
    return (
      <ClientClientsInfo
        initialData={fallbackClientsData}
        initialLanguage={locale}
      />
    );
  }
}
