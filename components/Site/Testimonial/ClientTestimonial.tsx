"use client";

import React, { useEffect, useState, useMemo } from "react";
import SectionHeader from "../Common/SectionHeader";
import { Autoplay, Pagination } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";
import SingleTestimonial from "./SingleTestimonial";
import { useLanguage } from "@/app/context/LanguageContext";
import { Testimonial } from "@/types/testimonial";
import SectionHeaderSkeleton from "../Skeleton/SectionHeaderSkeleton";

// Interface for testimonial data from server
interface TestimonialServerData {
  testimonial_title: string;
  testimonial_subtitle: string;
  testimonial_description: string;
  testimonials: Testimonial[];
}

interface TestimonialProps {
  initialData: TestimonialServerData;
  initialLanguage: string;
}

const ClientTestimonial = ({
  initialData,
  initialLanguage,
}: TestimonialProps) => {
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
  const {
    testimonialTitle,
    testimonialSubtitle,
    testimonialDescription,
    testimonials,
  } = useMemo(() => {
    return {
      testimonialTitle: initialData.testimonial_title || "TESTIMONIALS",
      testimonialSubtitle:
        initialData.testimonial_subtitle || "Client's Testimonials",
      testimonialDescription:
        initialData.testimonial_description ||
        "See what our clients say about our services and products.",
      testimonials: initialData.testimonials || [],
    };
  }, [initialData]);

  // Show loading state during brief transition to client
  if (isClient && !isContentReady) {
    return (
      <section id="testimonials" className="my-0 py-4">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
          <SectionHeaderSkeleton />
        </div>

        <div className="mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0">
          <div className="swiper testimonial-01 mx-20 pb-22.5">
            <div className="flex gap-5 overflow-hidden">
              {[1, 2].map((index) => (
                <div key={index} className="w-full flex-shrink-0 md:w-1/2">
                  <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="my-0 py-4">
      <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
        {/* Section Title */}
        <div className="animate_top mx-auto text-center">
          <SectionHeader
            headerInfo={{
              title: testimonialTitle,
              subtitle: testimonialSubtitle,
              description: testimonialDescription,
            }}
          />
        </div>
      </div>

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
        className="animate_top mx-auto mt-15 max-w-c-1280 px-4 md:px-8 xl:mt-20 xl:px-0"
      >
        {/* Slider main container */}
        <div className="swiper testimonial-01 mx-20 pb-22.5">
          {testimonials.length > 0 ? (
            <Swiper
              slidesPerView={2}
              autoplay={{
                delay: 1500,
                disableOnInteraction: true,
              }}
              pagination={{
                clickable: true,
              }}
              modules={[Autoplay, Pagination]}
              breakpoints={{
                0: {
                  slidesPerView: 1,
                },
                768: {
                  slidesPerView: 2,
                },
              }}
            >
              {testimonials.map((review) => (
                <SwiperSlide key={review?.id} className="px-5">
                  <SingleTestimonial review={review} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="flex justify-center py-10">
              <p className="text-center text-lg text-gray-500 dark:text-gray-400">
                {language === "id"
                  ? "Belum ada testimonial tersedia."
                  : "No testimonials available."}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
};

export default ClientTestimonial;
