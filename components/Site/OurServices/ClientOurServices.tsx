"use client";
import React, { useEffect, useMemo, useState } from "react";
import SectionHeader from "../Common/SectionHeader";
import { useLanguage } from "@/app/context/LanguageContext";
import SingleServices from "./SingleService";
import SectionHeaderSkeleton from "../Skeleton/SectionHeaderSkeleton";
import ServiceCardSkeleton from "../Skeleton/OurServiceCardSkeleton";

// Interface for services data from server
interface ServicesServerData {
  services_title: string;
  services_subtitle: string;
  services_data: any[];
}

interface OurServicesProps {
  initialData: ServicesServerData;
  initialLanguage: string;
}

const ClientOurServices = ({
  initialData,
  initialLanguage,
}: OurServicesProps) => {
  const { language } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  // Mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);

    // Simulate minimum loading time for smooth transition
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  const { servicesTitle, servicesSubtitle, servicesList } = useMemo(() => {
    return {
      servicesTitle: initialData.services_title || "",
      servicesSubtitle: initialData.services_subtitle || "",
      servicesList: initialData.services_data || [],
    };
  }, [initialData]);

  // CSS class for grid container that ensures equal height
  const serviceCardsContainerClasses =
    "mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr";

  // Show loading state during brief transition to client
  if (isClient && !isContentReady) {
    return (
      <section id="services" className="my-0 py-0">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
          <SectionHeaderSkeleton />
          <div className={serviceCardsContainerClasses}>
            {Array.from({ length: 6 }).map((_, index) => (
              <ServiceCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="my-0 py-0">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
        <SectionHeader
          headerInfo={{
            title: language === "id" ? "Layanan Kami" : "Our Services",
            subtitle: servicesTitle,
            description: servicesSubtitle,
          }}
        />

        <div className={serviceCardsContainerClasses}>
          {servicesList && servicesList.length > 0
            ? servicesList.map((feature, key) => (
                <SingleServices feature={feature} key={key} />
              ))
            : Array.from({ length: 3 }).map((_, index) => (
                <ServiceCardSkeleton key={index} />
              ))}
        </div>
      </div>
    </section>
  );
};

export default ClientOurServices;
