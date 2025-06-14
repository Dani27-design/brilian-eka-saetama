import { cookies } from "next/headers";
import ClientHero from "./ClientHero";
import { adminFirestore } from "@/db/firebase/firebaseAdmin";

// Struktur data untuk hero dari server
interface HeroServerData {
  hero_title: string;
  hero_subtitle: string;
  hero_slogan: string;
  email_placeholder: string;
  button_text: string;
}

// Default values untuk fallback
const fallbackHeroData: HeroServerData = {
  hero_title: "Solusi Keamanan & Proteksi Kebakaran",
  hero_subtitle:
    "Layanan instalasi dan pemeliharaan sistem proteksi kebakaran dan keamanan untuk bisnis dan properti Anda.",
  hero_slogan: "PT Brilian Eka Saetama",
  email_placeholder: "Masukkan alamat email",
  button_text: "Mari Terhubung",
};

// Fungsi untuk fetch hero data dari Firestore Admin
async function getHeroData(language: string): Promise<HeroServerData> {
  if (!adminFirestore) {
    console.error("Admin Firestore is not available");
    return fallbackHeroData;
  }

  try {
    // Buat objek untuk menyimpan semua data hero
    const heroData: HeroServerData = { ...fallbackHeroData };
    const fields = [
      "hero_title",
      "hero_subtitle",
      "hero_slogan",
      "email_placeholder",
      "button_text",
    ];

    // Fetch data untuk setiap field
    const fetchPromises = fields.map(async (field) => {
      try {
        if (!adminFirestore) {
          console.error("Admin Firestore is not available");
          return;
        }
        const docSnapshot = await adminFirestore
          .collection("hero")
          .doc(field)
          .get();

        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          if (data && data[language]) {
            heroData[field] = data[language];
          }
        }
      } catch (error) {
        console.error(`Error fetching ${field}:`, error);
      }
    });

    await Promise.all(fetchPromises);
    console.log("Hero data fetched from server:", heroData);
    return heroData;
  } catch (error) {
    console.error("Error fetching hero data:", error);
    return fallbackHeroData;
  }
}

export default async function ServerHero() {
  // Deteksi bahasa dari cookies
  const cookieStore = cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value || "id";

  try {
    // Fetch data dari Firestore Admin
    const heroData = await getHeroData(locale);

    // Kirim data ke client component
    return <ClientHero initialData={heroData} initialLanguage={locale} />;
  } catch (error) {
    console.error("Error in ServerHero:", error);
    return (
      <ClientHero initialData={fallbackHeroData} initialLanguage={locale} />
    );
  }
}
