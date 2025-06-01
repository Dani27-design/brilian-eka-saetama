"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";

// Types for clients data
interface ClientStat {
  id: number;
  value: string;
  label: string;
}

interface ClientsData {
  title: string;
  description: string;
  stats: ClientStat[];
}

const useClientsData = (lang: string, collectionId: string, docId: string) => {
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

const OurClients = () => {
  const { language } = useLanguage();

  const {
    data: clientsData,
    isLoading,
    error,
  } = useClientsData(language, "clients", "clients_data");

  useEffect(() => {
    if (error) {
      console.error("Error fetching clients data:", error);
    }
  }, [error]);

  // Default values in case data isn't loaded yet
  const clientsContent: ClientsData = clientsData || {
    title: "Trusted by Global Companies",
    description: "Loading client data...",
    stats: [],
  };

  return (
    <>
      {/* <!-- ===== OurClients Start ===== --> */}
      <section
        id="clients"
        className="pb-5 pt-35 lg:pb-10 lg:pt-40 xl:pb-15 xl:pt-45"
      >
        <div className="relative z-1 mx-auto max-w-c-1280 rounded-lg bg-gradient-to-t from-[#F8F9FF] to-[#DEE7FF] py-22.5 dark:bg-blacksection dark:bg-gradient-to-t dark:from-transparent dark:to-transparent dark:stroke-strokedark xl:py-27.5">
          <Image
            width={335}
            height={384}
            src="/images/shape/shape-04.png"
            alt="Man"
            priority={true} // For above-the-fold images
            quality={80} // Balance between quality and size
            loading="eager" // For critical images
            className="absolute -left-15 -top-25 -z-1 lg:left-0"
          />
          <Image
            width={132}
            height={132}
            src="/images/shape/shape-05.png"
            alt="Doodle"
            priority={true} // For above-the-fold images
            quality={80} // Balance between quality and size
            loading="eager" // For critical images
            className="absolute bottom-0 right-0 -z-1"
          />

          <Image
            fill
            src="/images/shape/shape-dotted-light-02.svg"
            alt="Dotted"
            priority={true} // For above-the-fold images
            quality={80} // Balance between quality and size
            loading="eager" // For critical images
            className="absolute left-0 top-0 -z-1 dark:hidden"
          />
          <Image
            fill
            src="/images/shape/shape-dotted-dark-02.svg"
            alt="Dotted"
            priority={true} // For above-the-fold images
            quality={80} // Balance between quality and size
            loading="eager" // For critical images
            className="absolute left-0 top-0 -z-1 hidden dark:block"
          />

          <motion.div
            variants={{
              hidden: {
                opacity: 0,
                y: -20,
              },
              visible: {
                opacity: 1,
                y: 0,
              },
            }}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 1, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top mx-auto mb-12.5 px-4 text-center md:w-4/5 md:px-0 lg:mb-17.5 lg:w-2/3 xl:w-1/2"
          >
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white xl:text-sectiontitle3">
              {clientsContent.title}
            </h2>
            <p className="mx-auto lg:w-11/12">{clientsContent.description}</p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8 lg:gap-42.5">
            {clientsContent.stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                variants={{
                  hidden: {
                    opacity: 0,
                    y: -20,
                  },
                  visible: {
                    opacity: 1,
                    y: 0,
                  },
                }}
                initial="hidden"
                whileInView="visible"
                transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                viewport={{ once: true }}
                className="animate_top text-center"
              >
                <h3 className="mb-2.5 text-3xl font-bold text-black dark:text-white xl:text-sectiontitle3">
                  {stat.value}
                </h3>
                <p className="text-lg lg:text-para2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* <!-- ===== OurClients End ===== --> */}
    </>
  );
};

export default OurClients;
