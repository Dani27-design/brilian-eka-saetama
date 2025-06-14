import { cookies } from "next/headers";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";
import ClientTestimonial from "./ClientTestimonial";
import { Testimonial } from "@/types/testimonial";

// Interface for testimonial data from server
interface TestimonialServerData {
  testimonial_title: string;
  testimonial_subtitle: string;
  testimonial_description: string;
  testimonials: Testimonial[];
}

// Default values for fallback
const fallbackTestimonialData: TestimonialServerData = {
  testimonial_title: "TESTIMONIALS",
  testimonial_subtitle: "Client's Testimonials",
  testimonial_description:
    "See what our clients say about our services and products.",
  testimonials: [],
};

// Function to fetch testimonial data from Firestore Admin
async function getTestimonialData(
  language: string,
): Promise<TestimonialServerData> {
  try {
    // Create object to store all testimonial data
    const testimonialData: TestimonialServerData = {
      ...fallbackTestimonialData,
    };

    // Fields to fetch from Firestore
    const fields = [
      "testimonial_title",
      "testimonial_subtitle",
      "testimonial_description",
      "testimonials",
    ];

    const fetchPromises = fields.map(async (field) => {
      try {
        if (!adminFirestore) {
          console.error("Admin Firestore is not available");
          return;
        }
        const docSnapshot = await adminFirestore
          .collection("testimonial")
          .doc(field)
          .get();

        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data && data[language]) {
            testimonialData[field] = data[language];
          }
        }
      } catch (error) {
        console.error(`Error fetching ${field}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    return testimonialData;
  } catch (error) {
    console.error("Error fetching testimonial data:", error);
    return fallbackTestimonialData;
  }
}

export default async function ServerTestimonial() {
  // Get language from cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data from Firestore Admin
    const testimonialData = await getTestimonialData(locale);

    // Pass data to client component
    return (
      <ClientTestimonial
        initialData={testimonialData}
        initialLanguage={locale}
      />
    );
  } catch (error) {
    console.error("Error in ServerTestimonial:", error);
    return (
      <ClientTestimonial
        initialData={fallbackTestimonialData}
        initialLanguage={locale}
      />
    );
  }
}
