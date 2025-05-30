"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import SectionHeader from "../Common/SectionHeader";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";
import { useEffect } from "react";
import { AboutSection } from "@/types/about";

const useAboutData = (lang: string, collectionId: string, docId: string) => {
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

const About = () => {
  const { language } = useLanguage();

  const {
    data: aboutTitleData,
    isLoading: isLoadingTitle,
    error: errorTitle,
  } = useAboutData(language, "about", "about_title");

  const {
    data: aboutSubtitleData,
    isLoading: isLoadingSubtitle,
    error: errorSubtitle,
  } = useAboutData(language, "about", "about_subtitle");

  const {
    data: aboutSectionsData,
    isLoading: isLoadingSections,
    error: errorSections,
  } = useAboutData(language, "about", "about_sections");

  useEffect(() => {
    if (errorTitle) {
      console.error("Error fetching about title data:", errorTitle);
    }
    if (errorSubtitle) {
      console.error("Error fetching about subtitle data:", errorSubtitle);
    }
    if (errorSections) {
      console.error("Error fetching about sections data:", errorSections);
    }
  }, [errorTitle, errorSubtitle, errorSections]);

  let aboutTitle = "";
  let aboutSubtitle = "";
  let aboutSections: AboutSection[] = [];

  if (aboutTitleData) {
    aboutTitle = aboutTitleData;
  }

  if (aboutSubtitleData) {
    aboutSubtitle = aboutSubtitleData;
  }

  if (aboutSectionsData) {
    aboutSections = aboutSectionsData;
  }

  return (
    <>
      {/* <!-- ===== About Start ===== --> */}
      <section id="aboutus" className="py-10 lg:py-15 xl:py-20">
        <div className="mx-auto max-w-c-1235 px-4 md:px-8 xl:px-0">
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
                    className="mt-12.5 flex items-center gap-8 lg:gap-32.5"
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
                      className="animate_left relative mx-auto hidden aspect-[588/526.5] md:block md:w-1/2"
                    >
                      <Image
                        src={section.lightImage}
                        alt="About"
                        className="dark:hidden"
                        fill
                      />
                      <Image
                        src={section.darkImage}
                        alt="About"
                        className="hidden dark:block"
                        fill
                      />
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
                    className="mt-12.5 flex items-center gap-8 lg:gap-32.5"
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
                      {section.ctaText && (
                        <div>
                          <a
                            href={section.ctaLink || "#"}
                            className="group mt-7.5 inline-flex items-center gap-2.5 text-black hover:text-primary dark:text-white dark:hover:text-primary"
                          >
                            <span className="duration-300 group-hover:pr-2">
                              {section.ctaText}
                            </span>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 14 14"
                              fill="currentColor"
                            >
                              <path d="M10.4767 6.16701L6.00668 1.69701L7.18501 0.518677L13.6667 7.00034L7.18501 13.482L6.00668 12.3037L10.4767 7.83368H0.333344V6.16701H10.4767Z" />
                            </svg>
                          </a>
                        </div>
                      )}
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
                      transition={{ duration: 1, delay: 0.1 }}
                      viewport={{ once: true }}
                      className="animate_right relative mx-auto hidden aspect-[588/526.5] md:block md:w-1/2"
                    >
                      <Image
                        src={section.lightImage}
                        alt="About"
                        className="dark:hidden"
                        fill
                      />
                      <Image
                        src={section.darkImage}
                        alt="About"
                        className="hidden dark:block"
                        fill
                      />
                    </motion.div>
                  </div>
                );
              }
            })}
        </div>
      </section>
    </>
  );
};

export default About;
