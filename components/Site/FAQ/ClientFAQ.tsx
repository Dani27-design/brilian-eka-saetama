"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import FAQItem from "./FAQItem";
import { useLanguage } from "@/app/context/LanguageContext";

// Interface for FAQ data from server
interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface FAQServerData {
  faq_title: string;
  faq_subtitle: string;
  faq_items: FAQItem[];
}

interface FAQProps {
  initialData: FAQServerData;
  initialLanguage: string;
}

const ClientFAQ = ({ initialData, initialLanguage }: FAQProps) => {
  const { language } = useLanguage();
  const [activeFaq, setActiveFaq] = useState(0);
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
  const { faqTitle, faqSubtitle, faqItems } = useMemo(() => {
    return {
      faqTitle: initialData.faq_title || "",
      faqSubtitle: initialData.faq_subtitle || "",
      faqItems: initialData.faq_items || [],
    };
  }, [initialData]);

  const handleFaqToggle = (id: number) => {
    activeFaq === id ? setActiveFaq(0) : setActiveFaq(id);
  };

  // Show loading state during brief transition to client
  if (isClient && !isContentReady) {
    return (
      <section id="faq" className="my-0 py-10">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
          <div className="flex flex-wrap gap-8 md:flex-nowrap md:items-center xl:gap-32.5">
            <div className="md:w-2/5 lg:w-1/2">
              <div className="mb-2 h-6 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-10 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
            <div className="md:w-3/5 lg:w-1/2">
              <div className="rounded-lg bg-white shadow-solid-8 dark:border dark:border-strokedark dark:bg-blacksection">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border-b border-stroke dark:border-strokedark"
                  >
                    <div className="px-3 py-5 lg:px-9 lg:py-7.5">
                      <div className="mb-1 h-5 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="faq" className="my-0 py-10">
      <div className="relative mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
        <div className="absolute -bottom-16 -z-1 h-full w-full">
          {isClient && (
            <>
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
            </>
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
              {faqItems.length > 0 ? (
                faqItems.map((faq) => (
                  <FAQItem
                    key={faq.id}
                    faqData={{
                      ...faq,
                      activeFaq,
                      handleFaqToggle,
                    }}
                  />
                ))
              ) : (
                <div className="p-6 text-center">
                  {language === "id"
                    ? "Belum ada FAQ tersedia."
                    : "No FAQs available."}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ClientFAQ;
