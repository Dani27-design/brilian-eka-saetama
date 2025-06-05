"use client";
import { getData } from "@/actions/read/hero";
import { trimByParentheses } from "@/utils/trimText";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useEffect, useState, useMemo, useRef } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import TextSkeleton from "../Skeleton/TextSkeleton";
import React from "react";

const useHeroData = (lang: string, collectionId: string, docId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [`${collectionId}-${docId}-${lang}`],
    queryFn: () => getData(lang, collectionId, docId),
    staleTime: 1000 * 60 * 60, // Increase to 1 hour to reduce refetches
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchIntervalInBackground: false, // Turn off background refetching
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
      <div className="w-full md:w-3/5">
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
              {heroTitle}
              <span className="relative inline-block pl-2 before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full before:bg-titlebg dark:before:bg-titlebgdark ">
                {highlight}
              </span>
            </h1>
            <p
              className="text-body-color dark:text-body-color-dark min-h-[60px] max-w-[540px] whitespace-pre-wrap text-base leading-relaxed"
              style={{
                transition: "opacity 0.2s",
                contentVisibility: "auto", // Improves rendering performance
                willChange: "opacity", // Hint untuk browser
              }}
            >
              {heroSubtitle}
            </p>
          </>
        )}

        <div className="mt-5 lg:mt-10 xl:mt-10">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-wrap gap-5">
              {isLoading ? (
                <>
                  <div className="h-[2.5rem] w-[200px] rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-[2.5rem] w-[150px] rounded-full bg-gray-200 dark:bg-gray-700" />
                </>
              ) : (
                <>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="text"
                    placeholder={emailPlaceholder}
                    className="w-fit rounded-full border border-stroke px-6 py-2.5 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:focus:border-primary"
                  />
                  <button
                    aria-label="get started button"
                    className="rounded-full bg-black px-7.5 py-2.5 text-white dark:bg-btndark"
                    type="submit"
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
  isLoading: boolean;
}

const HeroMedia = React.memo(({ isLoading }: HeroMediaProps) => {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "/videos/company_profile_bes_hero.mp4";

  const handleVideoLoad = () => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setVideoLoaded(true);
    }
  };

  const handleVideoError = () => {
    console.error("Failed to load video");
    setVideoError(true);
  };

  // Ensure video loading is properly tracked
  useEffect(() => {
    const video = videoRef.current;

    if (video) {
      // If video is already loaded when component mounts
      if (video.readyState >= 3) {
        setVideoLoaded(true);
      }

      // Add event listeners
      video.addEventListener("canplay", handleVideoLoad);
      video.addEventListener("loadeddata", handleVideoLoad);
      video.addEventListener("error", handleVideoError);

      // Reduce initial quality for faster loading
      video.addEventListener("loadedmetadata", () => {
        if (
          "connection" in navigator &&
          (navigator as any).connection?.effectiveType === "4g"
        ) {
          video.play();
        } else {
          // Slower connections - maybe don't autoplay
          setVideoLoaded(true);
        }
      });
    }

    // Create a timeout to ensure we show something even if events don't fire
    const timer = setTimeout(() => {
      if (!videoLoaded && !videoError) {
        console.log("Video loading timeout - forcing loaded state");
        setVideoLoaded(true);
      }
    }, 3000); // 3 seconds timeout

    return () => {
      // Clean up event listeners
      if (video) {
        video.removeEventListener("canplay", handleVideoLoad);
        video.removeEventListener("loadeddata", handleVideoLoad);
        video.removeEventListener("error", handleVideoError);
      }
      clearTimeout(timer);
    };
  }, [videoLoaded, videoError]);

  return (
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
          loading="eager"
        />
        <Image
          src="/images/shape/shape-02.svg"
          alt="shape"
          width={36.9}
          height={36.7}
          className="absolute bottom-0 right-0 z-10"
          priority={true}
          quality={80}
          loading="eager"
        />
        <Image
          src="/images/shape/shape-03.svg"
          alt="shape"
          width={21.64}
          height={21.66}
          className="absolute -right-6.5 bottom-0 z-1"
          priority={true}
          quality={80}
          loading="eager"
        />
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            aspectRatio: "3/4",
            width: "100%",
            height: "auto",
            minHeight: "400px",
            maxHeight: "600px",
            backgroundColor: "rgba(0,0,0,0.05)",
          }}
        >
          {/* Stable skeleton that doesn't flicker */}
          {(!videoLoaded || isLoading) && (
            <div
              className="absolute inset-0 h-full w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"
              style={{ zIndex: 1 }}
            />
          )}

          {/* Video with smooth transition */}
          <video
            ref={videoRef}
            className={`h-full w-full object-cover shadow-solid-l ${
              videoLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{
              position: "absolute", // Always keep it absolute
              top: 0,
              left: 0, // Align to the top left
              transition: "opacity 0.5s ease",
              zIndex: videoLoaded ? 2 : 0,
            }}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
        </div>
      </div>
    </div>
  );
});

HeroMedia.displayName = "HeroMedia";

const Hero = () => {
  const { language } = useLanguage();

  // Use a single query for all hero content
  const { data: heroData, isLoading } = useQuery({
    queryKey: [`hero-all-${language}`],
    queryFn: async () => {
      const [title, subtitle, slogan, emailPlaceholder, buttonText] =
        await Promise.all([
          getData(language, "hero", "hero_title"),
          getData(language, "hero", "hero_subtitle"),
          getData(language, "hero", "hero_slogan"),
          getData(language, "hero", "email_placeholder"),
          getData(language, "hero", "button_text"),
        ]);

      return { title, subtitle, slogan, emailPlaceholder, buttonText };
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  // Default values
  const heroContent = useMemo(() => {
    let title = "";
    let highlight = "";
    let subtitle = "";
    let slogan = "";
    let emailPlace =
      language === "id" ? "Masukkan alamat email" : "Enter email address";
    let btnText = language === "id" ? "Mari Terhubung" : "Connect with us";

    if (heroData) {
      if (heroData.title) {
        const parsed = trimByParentheses(heroData.title);
        title = parsed.a;
        highlight = parsed.b;
      }

      subtitle = heroData.subtitle || subtitle;
      slogan = heroData.slogan || slogan;
      emailPlace = heroData.emailPlaceholder || emailPlace;
      btnText = heroData.buttonText || btnText;
    }

    return {
      heroTitle: title,
      highlight,
      heroSubtitle: subtitle,
      heroSlogan: slogan,
      emailPlaceholder: emailPlace,
      buttonText: btnText,
    };
  }, [heroData, language]);

  return (
    <section className="overflow-hidden pb-20 pt-25 md:pt-25 xl:pb-25 xl:pt-36">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start lg:gap-12 xl:gap-16">
          <HeroContent
            heroTitle={heroContent.heroTitle}
            highlight={heroContent.highlight}
            heroSubtitle={heroContent.heroSubtitle}
            heroSlogan={heroContent.heroSlogan}
            emailPlaceholder={heroContent.emailPlaceholder}
            buttonText={heroContent.buttonText}
            isLoading={isLoading}
          />
          <HeroMedia isLoading={isLoading} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
