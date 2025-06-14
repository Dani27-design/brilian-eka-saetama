import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientFAQ from "./ClientFAQ";

// Interface for FAQ data from server
interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface FAQServerData {
  faq_title: string;
  faq_subtitle: string;
  faq_items: FAQItem[];
}

// Default values for fallback
const fallbackFAQData: FAQServerData = {
  faq_title: "FAQ",
  faq_subtitle: "Frequently Asked Questions",
  faq_items: [
    {
      id: 1,
      question: "What services does your company provide?",
      answer:
        "We provide fire safety and security solutions for businesses and properties.",
    },
  ],
};

// Function to fetch FAQ data from Firestore Admin
async function getFAQData(language: string): Promise<FAQServerData> {
  try {
    // Create object to store all FAQ data
    const faqData: FAQServerData = { ...fallbackFAQData };
    const fields = ["faq_title", "faq_subtitle", "faq_items"];

    // Fetch data for each field
    const fetchPromises = fields.map(async (field) => {
      try {
        if (!adminFirestore) {
          console.error("Admin Firestore is not available");
          return;
        }
        const docSnapshot = await adminFirestore
          .collection("faq")
          .doc(field)
          .get();

        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data && data[language]) {
            faqData[field] = data[language];
          }
        }
      } catch (error) {
        console.error(`Error fetching ${field}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    console.log("FAQ data fetched from server:", faqData);
    return faqData;
  } catch (error) {
    console.error("Error fetching FAQ data:", error);
    return fallbackFAQData;
  }
}

export default async function ServerFAQ() {
  // Get language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const faqData = await getFAQData(locale);

    // Pass data to client component
    return <ClientFAQ initialData={faqData} initialLanguage={locale} />;
  } catch (error) {
    console.error("Error in ServerFAQ:", error);
    return <ClientFAQ initialData={fallbackFAQData} initialLanguage={locale} />;
  }
}
