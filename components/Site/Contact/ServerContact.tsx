import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientContact from "./ClientContact";

// Interface for contact data from server
interface ContactServerData {
  find_us: {
    title: string;
    location: {
      title: string;
      text: string;
    };
    email: {
      title: string;
      text: string;
    };
    phone: {
      title: string;
      text: string;
    };
  };
  send_message: {
    title: string;
    form: {
      name: { placeholder: string };
      email: { placeholder: string };
      subject: { placeholder: string };
      phone: { placeholder: string };
      message: { placeholder: string };
    };
    consent_text: string;
    submit_button: string;
  };
}

// Default values for fallback
const fallbackContactData: ContactServerData = {
  find_us: {
    title: "Find us",
    location: {
      title: "Our Location",
      text: "290 Maryam Springs 260, Courbevoie, Paris, France",
    },
    email: {
      title: "Email Address",
      text: "info@safefire.com",
    },
    phone: {
      title: "Phone Number",
      text: "+62 812 3456 7890",
    },
  },
  send_message: {
    title: "Send a message",
    form: {
      name: { placeholder: "Full name" },
      email: { placeholder: "Email address" },
      subject: { placeholder: "Subject" },
      phone: { placeholder: "Phone number" },
      message: { placeholder: "Message" },
    },
    consent_text:
      'By clicking Checkbox, you agree to use our "Form" terms And consent cookie usage in browser.',
    submit_button: "Send Message",
  },
};

// Function to fetch contact data from Firestore Admin
async function getContactData(language: string): Promise<ContactServerData> {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackContactData;
  }

  try {
    // Create object to store all contact data
    const contactData: ContactServerData = { ...fallbackContactData };

    // Fetch find_us data
    const findUsSnapshot = await adminFirestore
      .collection("contact")
      .doc("find_us")
      .get();

    if (findUsSnapshot.exists) {
      const data = findUsSnapshot.data();
      if (data && data[language]) {
        contactData.find_us = data[language];
      }
    }

    // Fetch send_message data
    const sendMessageSnapshot = await adminFirestore
      .collection("contact")
      .doc("send_message")
      .get();

    if (sendMessageSnapshot.exists) {
      const data = sendMessageSnapshot.data();
      if (data && data[language]) {
        contactData.send_message = data[language];
      }
    }

    console.log("Contact data fetched from server:", contactData);
    return contactData;
  } catch (error) {
    console.error("Error fetching contact data:", error);
    return fallbackContactData;
  }
}

export default async function ServerContact() {
  // Get language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const contactData = await getContactData(locale);

    // Pass data to client component
    return <ClientContact initialData={contactData} initialLanguage={locale} />;
  } catch (error) {
    console.error("Error in ServerContact:", error);
    return (
      <ClientContact
        initialData={fallbackContactData}
        initialLanguage={locale}
      />
    );
  }
}
