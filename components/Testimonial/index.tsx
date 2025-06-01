"use client";
import { useEffect } from "react";
import SectionHeader from "../Common/SectionHeader";
import { Autoplay, Pagination } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { motion } from "framer-motion";
import SingleTestimonial from "./SingleTestimonial";
import { useLanguage } from "@/app/context/LanguageContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getData } from "@/actions/read/hero";
import type { Testimonial } from "@/types/testimonial";

const useTestimonialData = (
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

const Testimonial = () => {
  const { language } = useLanguage();

  const {
    data: testimonialTitleData,
    isLoading: isLoadingTitle,
    error: errorTitle,
  } = useTestimonialData(language, "testimonial", "testimonial_title");

  const {
    data: testimonialSubtitleData,
    isLoading: isLoadingSubtitle,
    error: errorSubtitle,
  } = useTestimonialData(language, "testimonial", "testimonial_subtitle");

  const {
    data: testimonialDescriptionData,
    isLoading: isLoadingDescription,
    error: errorDescription,
  } = useTestimonialData(language, "testimonial", "testimonial_description");

  const {
    data: testimonialsData,
    isLoading: isLoadingTestimonials,
    error: errorTestimonials,
  } = useTestimonialData(language, "testimonial", "testimonials");

  useEffect(() => {
    if (errorTitle) {
      console.error("Error fetching testimonial title data:", errorTitle);
    }
    if (errorSubtitle) {
      console.error("Error fetching testimonial subtitle data:", errorSubtitle);
    }
    if (errorDescription) {
      console.error(
        "Error fetching testimonial description data:",
        errorDescription,
      );
    }
    if (errorTestimonials) {
      console.error("Error fetching testimonials data:", errorTestimonials);
    }
  }, [errorTitle, errorSubtitle, errorDescription, errorTestimonials]);

  // Default values in case data isn't loaded yet
  let testimonialTitle = "TESTIMONIALS";
  let testimonialSubtitle = "Client's Testimonials";
  let testimonialDescription =
    "See what our clients say about our services and products.";
  let testimonials: Testimonial[] = [];

  if (testimonialTitleData) {
    testimonialTitle = testimonialTitleData;
  }

  if (testimonialSubtitleData) {
    testimonialSubtitle = testimonialSubtitleData;
  }

  if (testimonialDescriptionData) {
    testimonialDescription = testimonialDescriptionData;
  }

  if (testimonialsData) {
    testimonials = testimonialsData;
  }

  return (
    <>
      <section id="testimonials" className="py-10 lg:py-15 xl:py-20">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 xl:px-0">
          {/* <!-- Section Title Start --> */}
          <div className="animate_top mx-auto text-center">
            <SectionHeader
              headerInfo={{
                title: testimonialTitle,
                subtitle: testimonialSubtitle,
                description: testimonialDescription,
              }}
            />
          </div>
          {/* <!-- Section Title End --> */}
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
          {/* <!-- Slider main container --> */}
          <div className="swiper testimonial-01 mx-20 pb-22.5">
            {/* <!-- Additional required wrapper --> */}
            <Swiper
              // spaceBetween={50}
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
                // when window width is >= 640px
                0: {
                  slidesPerView: 1,
                },
                // when window width is >= 768px
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
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default Testimonial;
