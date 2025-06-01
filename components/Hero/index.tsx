"use client";
import { getData } from "@/actions/read/hero";
import { trimByParentheses } from "@/utils/trimText";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import TextSkeleton from "../Skeleton/TextSkeleton";
import React from "react";

const useHeroData = (lang: string, collectionId: string, docId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [`${collectionId}-${docId}-${lang}`],
    queryFn: () => getData(lang, collectionId, docId),
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 5, // Data will stay in cache for 5 minutes after it becomes inactive
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchIntervalInBackground: true,
    retry: false,
    initialData: () => {
      return queryClient.getQueryData([`${collectionId}-${docId}-${lang}`]);
    },
  });
};

interface HeroContentProps {
  heroTitle: string;
  highlight: string;
  heroSubtitle: string;
  heroSlogan: string;
  emailPlaceholder: string;
  buttonText: string;
  isLoading: boolean;
}

const HeroContent = React.memo(
  ({
    heroTitle,
    highlight,
    heroSubtitle,
    heroSlogan,
    emailPlaceholder,
    buttonText,
    isLoading,
  }: HeroContentProps) => {
    const [email, setEmail] = useState("");

    const handleSubmit = (e) => {
      e.preventDefault();
    };

    return (
      <div className="md:w-1/2">
        {isLoading ? (
          <>
            <TextSkeleton width="60%" height="1.5rem" className="mb-4.5" />
            <TextSkeleton width="90%" height="3rem" className="mb-2" />
            <TextSkeleton width="50%" height="3rem" className="mb-5" />
            <TextSkeleton width="85%" height="4rem" className="mb-10" />
          </>
        ) : (
          <>
            <h4 className="mb-4.5 text-lg font-medium text-black dark:text-white">
              {heroSlogan}
            </h4>
            <h1 className="mb-5 pr-16 text-3xl font-bold text-black dark:text-white xl:text-hero ">
              {heroTitle} {"   "}
              <span className="relative inline-block before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full before:bg-titlebg dark:before:bg-titlebgdark ">
                {highlight}
              </span>
            </h1>
            <p className="whitespace-pre-wrap">{heroSubtitle}</p>
          </>
        )}

        <div className="mt-5 lg:mt-10 xl:mt-10">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap gap-5">
              {isLoading ? (
                <>
                  <TextSkeleton
                    width="200px"
                    height="2.5rem"
                    className="rounded-full"
                  />
                  <TextSkeleton
                    width="150px"
                    height="2.5rem"
                    className="rounded-full"
                  />
                </>
              ) : (
                <>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="text"
                    placeholder={emailPlaceholder}
                    className="w-fit rounded-full border border-stroke px-6 py-2.5 shadow-solid-2 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:shadow-none dark:focus:border-primary"
                  />
                  <button
                    aria-label="get started button"
                    className="flex rounded-full bg-black px-7.5 py-2.5 text-white duration-300 ease-in-out hover:bg-blackho dark:bg-btndark dark:hover:bg-blackho"
                  >
                    {buttonText}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  },
);

HeroContent.displayName = "HeroContent";

interface HeroMediaProps {
  mediaType: string;
  mediaSrc: string;
  isLoading: boolean;
}

const HeroMedia = React.memo(
  ({ mediaType, mediaSrc, isLoading }: HeroMediaProps) => (
    <div className="animate_right p-1 md:w-1/2 lg:block">
      <div className="relative 2xl:-mr-7.5">
        <Image
          src="/images/shape/shape-01.png"
          alt="shape"
          width={46}
          height={246}
          className="absolute -left-11.5 top-0"
          priority={true} // For above-the-fold images
          quality={80} // Balance between quality and size
          loading="eager" // For critical images
        />
        <Image
          src="/images/shape/shape-02.svg"
          alt="shape"
          width={36.9}
          height={36.7}
          className="absolute bottom-0 right-0 z-10"
          priority={true} // For above-the-fold images
          quality={80} // Balance between quality and size
          loading="eager" // For critical images
        />
        <Image
          src="/images/shape/shape-03.svg"
          alt="shape"
          width={21.64}
          height={21.66}
          className="absolute -right-6.5 bottom-0 z-1"
          priority={true} // For above-the-fold images
          quality={80} // Balance between quality and size
          loading="eager" // For critical images
        />
        <div className="relative aspect-[700/444] w-full overflow-hidden rounded-xl">
          {isLoading ? (
            <div className="h-full w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ) : mediaType === "video" ? (
            <video
              className="shadow-solid-l"
              src={mediaSrc}
              autoPlay
              loop
              muted
              playsInline
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            <Image
              src={mediaSrc}
              alt="hero image"
              fill
              sizes="(max-width: 640px) 95vw, (max-width: 768px) 85vw, 50vw" // Specific breakpoints
              className="object-cover"
              priority={true} // Only for key hero image
              quality={75} // Slightly lower quality for faster loading
              placeholder="blur" // Optional: Add placeholder for better UX
              blurDataURL="data:image/svg+xml;base64,..." // Generate a tiny blurDataURL
            />
          )}
        </div>
      </div>
    </div>
  ),
);

HeroMedia.displayName = "HeroMedia";

const Hero = () => {
  const { language } = useLanguage();

  // Core hero data
  const {
    data: heroTitleData,
    isLoading: isLoadingTitle,
    error: errorTitle,
  } = useHeroData(language, "hero", "hero_title");

  const {
    data: heroSubtitleData,
    isLoading: isLoadingSubtitle,
    error: errorSubtitle,
  } = useHeroData(language, "hero", "hero_subtitle");

  const {
    data: heroSloganData,
    isLoading: isLoadingSlogan,
    error: errorSlogan,
  } = useHeroData(language, "hero", "hero_slogan");

  // New media data
  const {
    data: mediaTypeData,
    isLoading: isLoadingMediaType,
    error: errorMediaType,
  } = useHeroData(language, "hero", "media_type");

  const {
    data: mediaSrcData,
    isLoading: isLoadingMediaSrc,
    error: errorMediaSrc,
  } = useHeroData(language, "hero", "media_src");

  // Text data for form elements
  const {
    data: emailPlaceholderData,
    isLoading: isLoadingEmailPlaceholder,
    error: errorEmailPlaceholder,
  } = useHeroData(language, "hero", "email_placeholder");

  const {
    data: buttonTextData,
    isLoading: isLoadingButtonText,
    error: errorButtonText,
  } = useHeroData(language, "hero", "button_text");

  useEffect(() => {
    // Log errors for debugging
    [
      { name: "hero_title", error: errorTitle },
      { name: "hero_subtitle", error: errorSubtitle },
      { name: "hero_slogan", error: errorSlogan },
      { name: "media_type", error: errorMediaType },
      { name: "media_src", error: errorMediaSrc },
      { name: "email_placeholder", error: errorEmailPlaceholder },
      { name: "button_text", error: errorButtonText },
    ].forEach(({ name, error }) => {
      if (error) {
        console.error(`Error fetching ${name} data:`, error);
      }
    });
  }, [
    errorTitle,
    errorSubtitle,
    errorSlogan,
    errorMediaType,
    errorMediaSrc,
    errorEmailPlaceholder,
    errorButtonText,
  ]);

  const isLoading =
    isLoadingTitle ||
    isLoadingSubtitle ||
    isLoadingSlogan ||
    isLoadingMediaType ||
    isLoadingMediaSrc ||
    isLoadingEmailPlaceholder ||
    isLoadingButtonText;

  const {
    heroTitle,
    highlight,
    heroSubtitle,
    heroSlogan,
    mediaType,
    mediaSrc,
    emailPlaceholder,
    buttonText,
  } = useMemo(() => {
    let title = "";
    let highlight = "";
    let subtitle = "";
    let slogan = "";
    let mType = "video"; // Default to video
    let mSrc = ""; // Default source
    let emailPlace =
      language === "id" ? "Masukkan alamat email" : "Enter email address"; // Default placeholder
    let btnText = language === "id" ? "Mari Terhubung" : "Connect with us"; // Default button text

    if (heroTitleData) {
      const parsed = trimByParentheses(heroTitleData);
      title = parsed.a;
      highlight = parsed.b;
    }

    if (heroSubtitleData) {
      subtitle = heroSubtitleData;
    }

    if (heroSloganData) {
      slogan = heroSloganData;
    }

    if (mediaTypeData) {
      mType = mediaTypeData;
    }

    if (mediaSrcData) {
      mSrc = mediaSrcData;
    }

    if (emailPlaceholderData) {
      emailPlace = emailPlaceholderData;
    }

    if (buttonTextData) {
      btnText = buttonTextData;
    }

    return {
      heroTitle: title,
      highlight,
      heroSubtitle: subtitle,
      heroSlogan: slogan,
      mediaType: mType,
      mediaSrc: mSrc,
      emailPlaceholder: emailPlace,
      buttonText: btnText,
    };
  }, [
    heroTitleData,
    heroSubtitleData,
    heroSloganData,
    mediaTypeData,
    mediaSrcData,
    emailPlaceholderData,
    buttonTextData,
    language,
  ]);

  return (
    <section className="overflow-hidden pb-20 pt-30 md:pt-35 xl:pb-25 xl:pt-46">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
        <div className="flex flex-col items-center gap-32.5 gap-y-8 lg:flex-row lg:gap-8 xl:flex-row">
          <HeroContent
            heroTitle={heroTitle}
            highlight={highlight}
            heroSubtitle={heroSubtitle}
            heroSlogan={heroSlogan}
            emailPlaceholder={emailPlaceholder}
            buttonText={buttonText}
            isLoading={isLoading}
          />
          <HeroMedia
            mediaType={mediaType}
            mediaSrc={mediaSrc}
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
