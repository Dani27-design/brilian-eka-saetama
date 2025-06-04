"use client";
import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../Common/SectionHeader";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";
import SingleServices from "./SingleService";
import SectionHeaderSkeleton from "../Skeleton/SectionHeaderSkeleton";
import ServiceCardSkeleton from "../Skeleton/OurServiceCardSkeleton";

const useServicesData = (lang: string, collectionId: string, docId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [`${collectionId}-${docId}-${lang}`],
    queryFn: async () => {
      // Add a small minimum delay to ensure skeleton shows on slow connections
      const minLoadTime = new Promise((resolve) => setTimeout(resolve, 600));
      const data = getData(lang, collectionId, docId);
      await minLoadTime;
      return data;
    },
    staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
    gcTime: 1000 * 60 * 5, // Data will stay in cache for 5 minutes after it becomes inactive
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    refetchIntervalInBackground: true,
    retry: false,
    // Force loading state to be true when fetching
    // even if there's cached data
    networkMode: "always",
  });
};

const Services = () => {
  const { language } = useLanguage();
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if viewport is mobile on client side
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    data: servicesTitleData,
    isLoading: isLoadingTitle,
    error: errorTitle,
  } = useServicesData(language, "services", "services_title");

  const {
    data: servicesSubtitleData,
    isLoading: isLoadingSubtitle,
    error: errorSubtitle,
  } = useServicesData(language, "services", "services_subtitle");

  const {
    data: servicesData,
    isLoading: isLoadingData,
    error: errorData,
  } = useServicesData(language, "services", "services_data");

  useEffect(() => {
    // Log errors for debugging
    [
      { name: "services_title", error: errorTitle },
      { name: "services_subtitle", error: errorSubtitle },
      { name: "services_data", error: errorData },
    ].forEach(({ name, error }) => {
      if (error) {
        console.error(`Error fetching ${name} data:`, error);
      }
    });
  }, [errorTitle, errorSubtitle, errorData]);

  // Use effect to track first load
  useEffect(() => {
    if (!isLoadingTitle && !isLoadingSubtitle && !isLoadingData) {
      setIsFirstLoad(false);
    }
  }, [isLoadingTitle, isLoadingSubtitle, isLoadingData]);

  // Improve loading state detection
  const isLoading =
    isLoadingTitle || isLoadingSubtitle || isLoadingData || isFirstLoad;

  const { servicesTitle, servicesSubtitle, servicesList } = useMemo(() => {
    let title = "";
    let subtitle = "";
    let dataList = [];

    if (servicesTitleData) {
      title = servicesTitleData;
    }

    if (servicesSubtitleData) {
      subtitle = servicesSubtitleData;
    }

    if (servicesData) {
      dataList = servicesData;
    }

    return {
      servicesTitle: title,
      servicesSubtitle: subtitle,
      servicesList: dataList,
    };
  }, [servicesTitleData, servicesSubtitleData, servicesData]);

  // CSS classes for the service cards container
  const serviceCardsContainerClasses = useMemo(() => {
    return `mt-12.5 grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:mt-15 lg:grid-cols-3 xl:mt-20 xl:gap-12.5 ${
      !isMobile ? "md:grid-rows-[auto]" : ""
    }`;
  }, [isMobile]);

  return (
    <section id="services" className="py-10 lg:py-15 xl:py-20">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
        {/* Always render the skeletons immediately during any loading state */}
        {isLoading && (
          <>
            <SectionHeaderSkeleton />
            <div className={serviceCardsContainerClasses}>
              {Array.from({ length: 6 }).map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
            </div>
          </>
        )}

        {/* Only render actual content when not loading */}
        {!isLoading && (
          <>
            <SectionHeader
              headerInfo={{
                title: language === "id" ? "Layanan Kami" : "Our Services",
                subtitle: servicesTitle,
                description: servicesSubtitle,
              }}
            />

            <div className={serviceCardsContainerClasses}>
              {servicesList?.map((feature, key) => (
                <SingleServices feature={feature} key={key} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Services;
