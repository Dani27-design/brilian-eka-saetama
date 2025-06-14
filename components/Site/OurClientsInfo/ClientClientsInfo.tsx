"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { Brand } from "@/types/brand";
import SingleCard from "./SingleClientInfo";

// Interface for clients data from server
interface ClientsInfoServerData {
  clients: Brand[];
}

interface ClientsInfoProps {
  initialData: ClientsInfoServerData;
  initialLanguage: string;
}

const ClientClientsInfo = ({
  initialData,
  initialLanguage,
}: ClientsInfoProps) => {
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

  // Prepare client data for rendering
  const brands = useMemo(() => {
    return initialData.clients || [];
  }, [initialData]);

  // Show loading state during brief transition to client
  if (isClient && !isContentReady) {
    return (
      <section className="border border-x-0 border-y-stroke bg-alabaster py-11 dark:border-y-strokedark dark:bg-black">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
          <div className="grid grid-cols-3 items-start justify-center gap-5 md:grid-cols-6 lg:gap-8 xl:gap-12">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="flex h-[170px] w-[120px] flex-col items-center justify-start gap-2"
              >
                <div className="flex h-[120px] w-[98px] items-center justify-center overflow-hidden rounded-lg">
                  <div className="relative h-full w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                </div>
                <div className="mt-2 h-[40px] w-full">
                  <div className="mx-auto h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-x-0 border-y-stroke bg-alabaster py-11 dark:border-y-strokedark dark:bg-black">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
        <div className="grid grid-cols-3 items-start justify-center gap-5 md:grid-cols-6 lg:gap-8 xl:gap-12">
          {brands.length > 0 ? (
            brands.map((brand, key) => <SingleCard brand={brand} key={key} />)
          ) : (
            <div className="col-span-full py-8 text-center">
              {language === "id"
                ? "Belum ada klien tersedia."
                : "No clients available."}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ClientClientsInfo;
