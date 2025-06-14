"use client";
import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/context/LanguageContext";

// Types for clients data
interface ClientStat {
  id: number;
  value: string;
  label: string;
}

interface ClientsServerData {
  clients_title: string;
  clients_description: string;
  clients_stats: ClientStat[];
}

interface OurClientsProps {
  initialData: ClientsServerData;
  initialLanguage: string;
}

const ClientOurClients = ({
  initialData,
  initialLanguage,
}: OurClientsProps) => {
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

  // Prepare data for rendering
  const { clientsTitle, clientsDescription, clientsStats } = useMemo(() => {
    return {
      clientsTitle: initialData.clients_title || "",
      clientsDescription: initialData.clients_description || "",
      clientsStats: initialData.clients_stats || [],
    };
  }, [initialData]);

  // Show loading state during brief transition to client
  if (isClient && !isContentReady) {
    return (
      <section
        id="clients"
        className="mt-10 pb-5 pt-20 lg:pb-10 lg:pt-25 xl:pb-15 xl:pt-30"
      >
        <div className="relative z-1 mx-auto max-w-c-1280 rounded-lg bg-gradient-to-t from-[#F8F9FF] to-[#DEE7FF] py-22.5 dark:bg-blacksection dark:bg-gradient-to-t dark:from-transparent dark:to-transparent dark:stroke-strokedark xl:py-27.5">
          <div className="animate_top mx-auto mb-12.5 px-4 text-center md:w-4/5 md:px-0 lg:mb-17.5 lg:w-2/3 xl:w-1/2">
            <div className="mx-auto mb-4 h-8 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="mx-auto h-16 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 lg:gap-42.5">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-2.5 h-10 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="mx-auto h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="clients"
      className="mt-10 pb-5 pt-20 lg:pb-10 lg:pt-25 xl:pb-15 xl:pt-30"
    >
      <div className="relative z-1 mx-auto max-w-c-1280 rounded-lg bg-gradient-to-t from-[#F8F9FF] to-[#DEE7FF] py-22.5 dark:bg-blacksection dark:bg-gradient-to-t dark:from-transparent dark:to-transparent dark:stroke-strokedark xl:py-27.5">
        <Image
          width={335}
          height={384}
          src="/images/shape/shape-04.png"
          alt="Man"
          priority={true}
          quality={80}
          loading="eager"
          className="absolute -left-15 -top-25 -z-1 lg:left-0"
          decoding="async"
        />
        <Image
          width={132}
          height={132}
          src="/images/shape/shape-05.png"
          alt="Doodle"
          priority={true}
          quality={80}
          loading="eager"
          className="absolute bottom-0 right-0 -z-1"
          decoding="async"
        />

        {/* Conditional rendering based on isClient state */}
        {isClient && (
          <>
            <Image
              fill
              src="/images/shape/shape-dotted-light-02.svg"
              alt="Dotted"
              priority={false}
              quality={80}
              loading="lazy"
              className="absolute left-0 top-0 -z-1 dark:hidden"
              decoding="async"
              sizes="100vw"
              style={{
                objectFit: "contain",
                objectPosition: "center",
              }}
            />
            <Image
              fill
              src="/images/shape/shape-dotted-dark-02.svg"
              alt="Dotted"
              priority={false}
              quality={80}
              loading="lazy"
              className="absolute left-0 top-0 -z-1 hidden dark:block"
              decoding="async"
              sizes="100vw"
              style={{
                objectFit: "contain",
                objectPosition: "center",
              }}
            />
          </>
        )}

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
            {clientsTitle}
          </h2>
          <p className="mx-auto lg:w-11/12">{clientsDescription}</p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-8 lg:gap-42.5">
          {clientsStats.map((stat, index) => (
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
  );
};

export default ClientOurClients;
