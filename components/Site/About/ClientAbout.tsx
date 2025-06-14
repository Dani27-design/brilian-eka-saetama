"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import SectionHeader from "../Common/SectionHeader";
import { useLanguage } from "@/app/context/LanguageContext";
import { AboutSection } from "@/types/about";
import SectionHeaderSkeleton from "../Skeleton/SectionHeaderSkeleton";

// Interface for about data from server
interface AboutServerData {
  about_title: string;
  about_subtitle: string;
  about_sections: any[];
}

interface AboutProps {
  initialData: AboutServerData;
  initialLanguage: string;
}

const ClientAbout = ({ initialData, initialLanguage }: AboutProps) => {
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

  const { aboutTitle, aboutSubtitle, aboutSections } = useMemo(() => {
    return {
      aboutTitle: initialData.about_title || "",
      aboutSubtitle: initialData.about_subtitle || "",
      aboutSections: initialData.about_sections || [],
    };
  }, [initialData]);

  // Show loading state during brief transition to client
  if (isClient && !isContentReady) {
    return (
      <section id="aboutus" className="my-0 py-4">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
          <SectionHeaderSkeleton />
          {[0, 1].map((index) => (
            <div
              key={index}
              className="mt-12.5 flex flex-wrap items-center gap-8 lg:gap-32.5"
            >
              <div className="relative order-2 mx-auto w-full md:order-1 md:w-1/3">
                <div className="relative aspect-square w-full">
                  <div className="h-full w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="mb-2 h-6 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mb-6 h-10 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-24 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section id="aboutus" className="my-0 py-4">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
        <SectionHeader
          headerInfo={{
            title: language === "id" ? "Tentang Kami" : "About Us",
            subtitle: aboutTitle,
            description: aboutSubtitle,
          }}
        />

        {aboutSections.length > 0 &&
          aboutSections.map((section, index) => {
            if (index % 2 === 0) {
              // Even sections (0, 2, 4...)
              return (
                <div
                  key={section.id}
                  className="mt-12.5 flex flex-wrap items-center gap-8 md:flex-row-reverse lg:gap-32.5"
                >
                  <motion.div
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: -20,
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                      },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="animate_left relative order-2 mx-auto w-full md:order-1 md:w-1/3"
                  >
                    <div className="relative aspect-square w-full">
                      <Image
                        src={section.lightImage}
                        alt="About"
                        className="rounded-lg object-cover dark:hidden"
                        fill
                        priority={true}
                        quality={80}
                        loading="eager"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <Image
                        src={section.darkImage}
                        alt="About"
                        className="hidden rounded-lg object-cover dark:block"
                        fill
                        priority={true}
                        quality={80}
                        loading="eager"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: 20,
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                      },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    transition={{ duration: 0.5, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="animate_right md:w-1/2"
                  >
                    <h4 className="font-medium uppercase text-black dark:text-white">
                      {section.title}
                    </h4>
                    <h2 className="relative mb-6 text-3xl font-bold text-black dark:text-white xl:text-hero">
                      {section.subtitle}
                    </h2>
                    <p>{section.description}</p>

                    {section.points &&
                      section.points.map((point) => (
                        <div
                          key={point.id}
                          className="mt-7.5 flex items-center gap-5"
                        >
                          <div className="flex h-15 w-15 items-center justify-center rounded-[50%] border border-stroke dark:border-strokedark dark:bg-blacksection">
                            <p className="text-metatitle2 font-semibold text-black dark:text-white">
                              {point.number}
                            </p>
                          </div>
                          <div className="w-3/4">
                            <h3 className="mb-0.5 text-metatitle2 text-black dark:text-white">
                              {point.title}
                            </h3>
                            <p>{point.description}</p>
                          </div>
                        </div>
                      ))}
                  </motion.div>
                </div>
              );
            } else {
              // Odd sections (1, 3, 5...)
              return (
                <div
                  key={section.id}
                  className="mt-12.5 flex flex-wrap items-center gap-8 lg:gap-32.5"
                >
                  <motion.div
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: 20,
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                      },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    transition={{ duration: 1, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="animate_right relative order-2 mx-auto w-full md:order-1 md:w-1/3"
                  >
                    <div className="relative aspect-square w-full">
                      <Image
                        src={section.lightImage}
                        alt="About"
                        className="rounded-lg object-cover dark:hidden"
                        fill
                        priority={true}
                        quality={80}
                        loading="eager"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <Image
                        src={section.darkImage}
                        alt="About"
                        className="hidden rounded-lg object-cover dark:block"
                        fill
                        priority={true}
                        quality={80}
                        loading="eager"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: -20,
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                      },
                    }}
                    initial="hidden"
                    whileInView="visible"
                    transition={{ duration: 1, delay: 0.1 }}
                    viewport={{ once: true }}
                    className="animate_left md:w-1/2"
                  >
                    <h4 className="font-medium uppercase text-black dark:text-white">
                      {section.title}
                    </h4>
                    <h2 className="relative mb-6 text-3xl font-bold text-black dark:text-white xl:text-hero">
                      {section.subtitle}
                    </h2>
                    <p>{section.description}</p>
                  </motion.div>
                </div>
              );
            }
          })}
      </div>
    </section>
  );
};

export default ClientAbout;
