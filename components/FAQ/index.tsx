"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import FAQItem from "./FAQItem";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";

const useFAQData = (lang: string, collectionId: string, docId: string) => {
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

const FAQ = () => {
  const [activeFaq, setActiveFaq] = useState(1);
  const { language } = useLanguage();
  const [isClient, setIsClient] = useState(false);

  const {
    data: faqTitleData,
    isLoading: isLoadingTitle,
    error: errorTitle,
  } = useFAQData(language, "faq", "faq_title");

  const {
    data: faqSubtitleData,
    isLoading: isLoadingSubtitle,
    error: errorSubtitle,
  } = useFAQData(language, "faq", "faq_subtitle");

  const {
    data: faqItemsData,
    isLoading: isLoadingItems,
    error: errorItems,
  } = useFAQData(language, "faq", "faq_items");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (errorTitle) {
      console.error("Error fetching FAQ title data:", errorTitle);
    }
    if (errorSubtitle) {
      console.error("Error fetching FAQ subtitle data:", errorSubtitle);
    }
    if (errorItems) {
      console.error("Error fetching FAQ items data:", errorItems);
    }
  }, [errorTitle, errorSubtitle, errorItems]);

  let faqTitle = "OUR FAQS";
  let faqSubtitle = "Frequently Asked Questions";
  let faqCta = "Know More";
  let faqItems = [];

  if (faqTitleData) {
    faqTitle = faqTitleData;
  }

  if (faqSubtitleData) {
    faqSubtitle = faqSubtitleData;
  }

  if (faqItemsData) {
    faqItems = faqItemsData;
  }

  const handleFaqToggle = (id: number) => {
    activeFaq === id ? setActiveFaq(0) : setActiveFaq(id);
  };

  return (
    <section id="faq" className="my-0 py-10">
      <div className="relative mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
        <div className="absolute -bottom-16 -z-1 h-full w-full">
          {isClient ? (
            <Image
              src="/images/shape/shape-dotted-light-02.svg"
              alt="Shape"
              fill
              sizes="100vw"
              style={{
                objectFit: "contain",
                objectPosition: "center",
              }}
              className="absolute left-0 top-0 -z-1 dark:hidden"
              quality={80}
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 -z-1"></div>
          )}

          {isClient && (
            <Image
              src="/images/shape/shape-dotted-dark-02.svg"
              alt="Shape"
              fill
              sizes="100vw"
              style={{
                objectFit: "contain",
                objectPosition: "center",
              }}
              className="absolute left-0 top-0 -z-1 hidden dark:block"
              quality={80}
              loading="lazy"
            />
          )}
        </div>
        <div className="flex flex-wrap gap-8 md:flex-nowrap md:items-center xl:gap-32.5">
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
            className="animate_left md:w-2/5 lg:w-1/2"
          >
            <span className="font-medium uppercase text-black dark:text-white">
              {faqTitle}
            </span>
            <h2 className="relative mb-6 text-3xl font-bold text-black dark:text-white xl:text-hero">
              <span className="relative inline-block before:absolute before:bottom-2.5 before:left-0 before:-z-1 before:h-3 before:w-full before:bg-titlebg2 dark:before:bg-titlebgdark">
                {faqSubtitle}
              </span>
            </h2>
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
            className="animate_right md:w-3/5 lg:w-1/2"
          >
            <div className="rounded-lg bg-white shadow-solid-8 dark:border dark:border-strokedark dark:bg-blacksection">
              {faqItems.length > 0 &&
                faqItems.map((faq: any, key) => (
                  <FAQItem
                    key={key}
                    faqData={{ ...faq, activeFaq, handleFaqToggle }}
                  />
                ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
