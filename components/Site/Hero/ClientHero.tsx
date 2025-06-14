"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import emailjs from "@emailjs/browser";
import { useLanguage } from "@/app/context/LanguageContext";

// Interface untuk initial data dari server
interface HeroServerData {
  hero_title: string;
  hero_subtitle: string;
  hero_slogan: string;
  email_placeholder: string;
  button_text: string;
}

interface HeroProps {
  initialData: HeroServerData;
  initialLanguage: string;
}

// Hero Form Component
function HeroForm({ emailPlaceholder, buttonText }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: null | "error" | "success";
    message: string;
  }>({
    type: null,
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateIdInboundConsultation =
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_INBOUND_CONSULTATION;
      const templateIdOutbondWelcome =
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_OUTBOUND_WELCOME;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      // Validate EmailJS credentials exist
      if (
        !serviceId ||
        !templateIdInboundConsultation ||
        !publicKey ||
        !templateIdOutbondWelcome
      ) {
        throw new Error("EmailJS credentials are not properly configured");
      }

      // Prepare template parameters for EmailJS
      const templateParams = {
        to_email: "ptbrilianekasaetama@gmail.com",
        from_name: email.replace(/@.*/, ""),
        from_email: email,
        subject: "Ingin Terhubung",
        message: `Pengunjung Website '${email.replace(
          /@.*/,
          "",
        )}' dari email '${email}' ingin terhubung dan konsultasi lebih lanjut.`,
      };

      // Send email using EmailJS
      await emailjs.send(
        serviceId,
        templateIdInboundConsultation,
        templateParams,
        publicKey,
      );

      await emailjs.send(
        serviceId,
        templateIdOutbondWelcome,
        {
          email: email,
        },
        publicKey,
      );

      // Reset form after successful submission
      setEmail("");

      // Show success message
      setSubmitStatus({
        type: "success",
        message: "Thank you for subscribing! We'll be in touch soon.",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      setSubmitStatus({
        type: "error",
        message: "Failed to submit your email. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear status message after 5 seconds
  useEffect(() => {
    if (submitStatus.type) {
      const timer = setTimeout(() => {
        setSubmitStatus({ type: null, message: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            placeholder={emailPlaceholder}
            className="w-fit rounded-full border border-stroke px-6 py-2.5 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:focus:border-primary"
            disabled={isSubmitting}
          />
          <button
            aria-label="get started button"
            className={`rounded-full bg-black px-7.5 py-2.5 text-white dark:bg-btndark ${
              isSubmitting ? "cursor-not-allowed opacity-70" : ""
            }`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : buttonText}
          </button>
        </div>
      </form>

      {submitStatus.type && (
        <div
          className={`mt-3 rounded-md p-3 text-sm ${
            submitStatus.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {submitStatus.message}
        </div>
      )}
    </div>
  );
}

// Hero Video Component
function HeroVideo() {
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

  useEffect(() => {
    const video = videoRef.current;
    const timer = setTimeout(() => {
      if (!videoLoaded && video) {
        handleVideoLoad();
      }
    }, 100);

    if (video) {
      if (video.readyState >= 3) {
        setVideoLoaded(true);
      }

      video.addEventListener("loadeddata", handleVideoLoad);
      video.addEventListener("error", handleVideoError);
    }

    return () => {
      if (video) {
        video.removeEventListener("loadeddata", handleVideoLoad);
        video.removeEventListener("error", handleVideoError);
      }
      clearTimeout(timer);
    };
  }, [videoLoaded]);

  return (
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
      {!videoLoaded && (
        <div
          className="absolute inset-0 h-full w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"
          style={{ zIndex: 1 }}
        />
      )}

      <video
        ref={videoRef}
        className={`h-full w-full object-cover shadow-solid-l ${
          videoLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
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
  );
}

// Main Hero Component yang menerima data dari Server Component
export default function ClientHero({
  initialData,
  initialLanguage,
}: HeroProps) {
  const { language } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  // Mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);

    // Simulasi waktu loading minimal untuk transisi yang halus
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Prepare hero content
  // Extract text inside parentheses from hero_title for highlight
  const extractHighlight = (text: string) => {
    const match = text.match(/\((.*?)\)/);
    return match ? match[1] : "";
  };

  const removeHighlight = (text: string) => {
    return text.replace(/\s*\(.*?\)\s*/, " ").trim();
  };

  const rawHeroTitle = initialData.hero_title || "";
  const highlightText = extractHighlight(rawHeroTitle);
  const cleanHeroTitle = removeHighlight(rawHeroTitle);

  const heroContent = {
    heroTitle: cleanHeroTitle,
    heroSubtitle: initialData.hero_subtitle || "",
    heroSlogan: initialData.hero_slogan || "",
    emailPlaceholder:
      initialData.email_placeholder ||
      (language === "id" ? "Masukkan alamat email" : "Enter email address"),
    buttonText:
      initialData.button_text ||
      (language === "id" ? "Mari Terhubung" : "Connect with us"),
  };

  // Show loading state untuk singkat masa transisi ke client
  if (isClient && !isContentReady) {
    return (
      <section className="overflow-hidden pb-20 pt-25 md:pt-25 xl:pb-25 xl:pt-36">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start lg:gap-12 xl:gap-16">
            <div className="w-full md:w-3/5">
              <div className="mb-4.5 h-6 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-10 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-8 h-20 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mt-5 h-10 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="w-full md:w-2/5">
              <div className="h-[500px] w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
              {cleanHeroTitle}
              <span className="relative inline-block pl-2 before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full before:bg-titlebg dark:before:bg-titlebgdark">
                {highlightText}
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
