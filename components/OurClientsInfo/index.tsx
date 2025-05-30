"use client";
import React, { useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";
import { Brand } from "@/types/brand";
import SingleCard from "./SingleClientInfo";

const useClientsInfoData = (
  lang: string,
  collectionId: string,
  docId: string,
) => {
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

const ClientsInfo = () => {
  const { language } = useLanguage();

  const {
    data: brandsData,
    isLoading,
    error,
  } = useClientsInfoData(language, "clientsInfo", "clients");

  useEffect(() => {
    if (error) {
      console.error("Error fetching client info data:", error);
    }
  }, [error]);

  // Default empty array in case data isn't loaded yet
  const brands: Brand[] = brandsData || [];

  return (
    <>
      {/* <!-- ===== Clients Start ===== --> */}
      <section className="border border-x-0 border-y-stroke bg-alabaster py-11 dark:border-y-strokedark dark:bg-black">
        <div className="mx-auto max-w-c-1390 px-4 md:px-8 2xl:px-0">
          {isLoading ? (
            <div className="text-center">Loading clients...</div>
          ) : (
            <div className="grid grid-cols-3 items-center justify-center gap-7.5 md:grid-cols-6 lg:gap-12.5 xl:gap-29">
              {brands.map((brand, key) => (
                <SingleCard brand={brand} key={key} />
              ))}
            </div>
          )}
        </div>
      </section>
      {/* <!-- ===== Clients End ===== --> */}
    </>
  );
};

export default ClientsInfo;
