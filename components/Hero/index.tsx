import Image from "next/image";
import { trimByParentheses } from "@/utils/trimText";
import { HeroForm, HeroVideo } from "./HeroClient";

// Server component to fetch data
async function getHeroData(language) {
  const fetchData = async (key) => {
    // Import the getData function directly to avoid client-side import
    const { getData } = await import("@/actions/read/hero");
    return getData(language, "hero", key);
  };

  // Fetch all data in parallel
  const [title, subtitle, slogan, emailPlaceholder, buttonText] =
    await Promise.all([
      fetchData("hero_title"),
      fetchData("hero_subtitle"),
      fetchData("hero_slogan"),
      fetchData("email_placeholder"),
      fetchData("button_text"),
    ]);

  // Process hero title to extract highlight
  let highlight = "";
  let processedTitle = title || "";

  if (title) {
    const parsed = trimByParentheses(title);
    processedTitle = parsed.a;
    highlight = parsed.b;
  }

  // Default values if data is missing
  return {
    heroTitle: processedTitle,
    highlight,
    heroSubtitle: subtitle || "",
    heroSlogan: slogan || "",
    emailPlaceholder:
      emailPlaceholder ||
      (language === "id" ? "Masukkan alamat email" : "Enter email address"),
    buttonText:
      buttonText || (language === "id" ? "Mari Terhubung" : "Connect with us"),
  };
}

// Server component - no "use client" directive
export default async function Hero({ language = "id" }) {
  // Fetch data on the server
  const heroContent = await getHeroData(language);

  return (
    <section className="overflow-hidden pb-20 pt-25 md:pt-25 xl:pb-25 xl:pt-36">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start lg:gap-12 xl:gap-16">
          {/* Hero Content */}
          <div className="w-full md:w-3/5">
            <h4 className="mb-4.5 text-lg font-medium text-black dark:text-white">
              {heroContent.heroSlogan}
            </h4>
            <h1 className="mb-5 pr-16 text-3xl font-bold text-black dark:text-white xl:text-hero">
              {heroContent.heroTitle}
              <span className="relative inline-block pl-2 before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full before:bg-titlebg dark:before:bg-titlebgdark">
                {heroContent.highlight}
              </span>
            </h1>
            <p className="text-body-color dark:text-body-color-dark min-h-[60px] max-w-[540px] whitespace-pre-wrap text-base leading-relaxed">
              {heroContent.heroSubtitle}
            </p>

            <div className="mt-5 lg:mt-10 xl:mt-10">
              <HeroForm
                emailPlaceholder={heroContent.emailPlaceholder}
                buttonText={heroContent.buttonText}
              />
            </div>
          </div>

          {/* Hero Media */}
          <div className="w-full p-1 md:w-2/5 lg:w-2/5">
            <div className="relative mx-auto max-w-[420px] 2xl:-mr-7.5">
              <Image
                src="/images/shape/shape-01.png"
                alt="shape"
                width={46}
                height={246}
                className="absolute -left-11.5 top-0"
                priority={true}
                quality={80}
              />
              <Image
                src="/images/shape/shape-02.svg"
                alt="shape"
                width={36.9}
                height={36.7}
                className="absolute bottom-0 right-0 z-10"
                priority={true}
                quality={80}
              />
              <Image
                src="/images/shape/shape-03.svg"
                alt="shape"
                width={21.64}
                height={21.66}
                className="absolute -right-6.5 bottom-0 z-1"
                priority={true}
                quality={80}
              />

              <HeroVideo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
