"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";

interface Testimonial {
  id: number;
  name: string;
  designation: string;
  imageUrl: string;
  content: string;
}

interface TestimonialPreviewProps {
  data: {
    [key: string]: {
      [lang: string]: any;
    };
  };
  activeSection: string | null;
  onEditSection?: (section: string) => void;
  previewMode?: "desktop" | "mobile";
  onPreviewModeChange?: (mode: "desktop" | "mobile") => void;
}

const TestimonialPreview = ({
  data,
  activeSection,
  onEditSection,
  previewMode = "desktop",
  onPreviewModeChange,
}: TestimonialPreviewProps) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [internalPreviewMode, setInternalPreviewMode] = useState<
    "desktop" | "mobile"
  >(previewMode);

  // Use internal state if no external control is provided
  const currentPreviewMode = onPreviewModeChange
    ? previewMode
    : internalPreviewMode;

  const handlePreviewModeChange = (mode: "desktop" | "mobile") => {
    if (onPreviewModeChange) {
      onPreviewModeChange(mode);
    } else {
      setInternalPreviewMode(mode);
    }
  };

  // Process the testimonial data for the current language
  const processTestimonialData = () => {
    const currentLang = language || "en";

    // Get testimonial title
    const getTestimonialTitle = () => {
      if (!data.testimonial_title || !data.testimonial_title[currentLang]) {
        return currentLang === "en" ? "TESTIMONIALS" : "TESTIMONI";
      }
      return data.testimonial_title[currentLang];
    };

    // Get testimonial subtitle
    const getTestimonialSubtitle = () => {
      if (
        !data.testimonial_subtitle ||
        !data.testimonial_subtitle[currentLang]
      ) {
        return currentLang === "en"
          ? "Client's Testimonials"
          : "Testimoni Klien";
      }
      return data.testimonial_subtitle[currentLang];
    };

    // Get testimonial description
    const getTestimonialDescription = () => {
      if (
        !data.testimonial_description ||
        !data.testimonial_description[currentLang]
      ) {
        return currentLang === "en"
          ? "See what our clients say about our services and products."
          : "Lihat apa yang klien kami katakan tentang layanan dan produk kami.";
      }
      return data.testimonial_description[currentLang];
    };

    // Get testimonials
    const getTestimonials = () => {
      try {
        if (!data.testimonials || !data.testimonials[currentLang]) {
          return [
            {
              id: 1,
              name: "John Doe",
              designation:
                currentLang === "en"
                  ? "CEO, Company Inc."
                  : "CEO, Perusahaan Inc.",
              imageUrl: "/images/user/user-01.png",
              content:
                currentLang === "en"
                  ? "Working with this team has been an incredible experience! They delivered beyond our expectations and truly understood our vision."
                  : "Bekerja dengan tim ini adalah pengalaman luar biasa! Mereka memberikan hasil melebihi ekspektasi kami dan benar-benar memahami visi kami.",
            },
            {
              id: 2,
              name: "Jane Smith",
              designation:
                currentLang === "en"
                  ? "Marketing Director"
                  : "Direktur Pemasaran",
              imageUrl: "/images/user/user-02.png",
              content:
                currentLang === "en"
                  ? "Exceptional service and attention to detail. Our project was completed on time and within budget. Highly recommended!"
                  : "Layanan yang luar biasa dan perhatian terhadap detail. Proyek kami selesai tepat waktu dan sesuai anggaran. Sangat direkomendasikan!",
            },
          ];
        }
        const items = data.testimonials[currentLang];
        return Array.isArray(items) ? items : [];
      } catch (e) {
        console.error("Error parsing testimonials:", e);
        return [];
      }
    };

    return {
      title: getTestimonialTitle(),
      subtitle: getTestimonialSubtitle(),
      description: getTestimonialDescription(),
      testimonials: getTestimonials(),
    };
  };

  const testimonialContent = processTestimonialData();

  // Single Testimonial Component - Styled to match the actual component
  const SingleTestimonialCard = ({ review }: { review: Testimonial }) => {
    return (
      <div className="rounded-lg bg-white p-5 shadow-solid-9 dark:border dark:border-strokedark dark:bg-blacksection dark:shadow-none">
        <div className="flex items-center gap-4 border-b border-stroke pb-9 dark:border-strokedark">
          <div className="relative h-15 w-15 overflow-hidden rounded-full">
            {review.imageUrl ? (
              <Image
                src={review.imageUrl}
                alt={review.name}
                width={40}
                height={40}
                quality={50}
                className="w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-xl text-gray-500">
                {review.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-black dark:text-white">
              {review.name}
            </h3>
            <p className="text-sm">{review.designation}</p>
          </div>
        </div>

        <div className="mt-9">
          <p>{review.content}</p>
        </div>
      </div>
    );
  };

  // Render testimonial content for device frames
  const renderTestimonialContent = () => (
    <div className="mx-auto w-full py-4">
      <div className="mx-auto px-0">
        {/* Section Title Start */}
        <div
          className="mx-auto cursor-pointer text-center"
          onClick={(e) => {
            e.stopPropagation();
            if (
              activeSection !== "testimonial_title" &&
              activeSection !== "testimonial_subtitle" &&
              activeSection !== "testimonial_description" &&
              onEditSection
            ) {
              onEditSection("testimonial_title");
            }
          }}
        >
          {/* Title */}
          <div
            className="relative mb-2"
            onMouseEnter={() => setHoveredSection("testimonial_title")}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (activeSection !== "testimonial_title" && onEditSection) {
                onEditSection("testimonial_title");
              }
            }}
          >
            <div className="inline-block rounded-full bg-zumthor px-4.5 py-1.5 dark:border dark:border-strokedark dark:bg-blacksection">
              <span className="text-sectiontitle font-medium text-black dark:text-white">
                {testimonialContent.title}
              </span>
            </div>

            {(hoveredSection === "testimonial_title" ||
              activeSection === "testimonial_title") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-0 left-1/3 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Testimonial Title (Click to Edit)
                </div>
              </>
            )}
          </div>

          {/* Subtitle */}
          <div
            className="relative mb-3"
            onMouseEnter={() => setHoveredSection("testimonial_subtitle")}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (activeSection !== "testimonial_subtitle" && onEditSection) {
                onEditSection("testimonial_subtitle");
              }
            }}
          >
            <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">
              {testimonialContent.subtitle}
            </h2>

            {(hoveredSection === "testimonial_subtitle" ||
              activeSection === "testimonial_subtitle") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Testimonial Subtitle (Click to Edit)
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <div
            className="relative mb-8"
            onMouseEnter={() => setHoveredSection("testimonial_description")}
            onMouseLeave={() => setHoveredSection(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (
                activeSection !== "testimonial_description" &&
                onEditSection
              ) {
                onEditSection("testimonial_description");
              }
            }}
          >
            <p className="text-body-color mx-auto max-w-[570px] text-base">
              {testimonialContent.description}
            </p>

            {(hoveredSection === "testimonial_description" ||
              activeSection === "testimonial_description") && (
              <>
                <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
                <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
                  Testimonial Description (Click to Edit)
                </div>
              </>
            )}
          </div>
        </div>
        {/* Section Title End */}

        {/* Testimonials */}
        <div
          className="relative mt-15 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (activeSection !== "testimonials" && onEditSection) {
              onEditSection("testimonials");
            }
          }}
          onMouseEnter={() => setHoveredSection("testimonials")}
          onMouseLeave={() => setHoveredSection(null)}
        >
          {/* In preview, we use a grid layout to simulate the carousel based on preview mode */}
          <div className="mx-auto pb-22.5">
            {/* Use a grid for desktop and a column for mobile */}
            <div
              className={
                currentPreviewMode === "mobile"
                  ? "space-y-6"
                  : "grid grid-cols-2 gap-6"
              }
            >
              {testimonialContent.testimonials &&
              testimonialContent.testimonials.length > 0 ? (
                testimonialContent.testimonials
                  .slice(0, currentPreviewMode === "desktop" ? 2 : 1)
                  .map((review: Testimonial) => (
                    <SingleTestimonialCard key={review.id} review={review} />
                  ))
              ) : (
                <div className="col-span-full rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  <span className="mb-3 block text-3xl">✨</span>
                  <p>
                    No testimonials added yet. Click here to add testimonials.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination dots simulation */}
            <div className="mt-8 flex justify-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-primary"></span>
              <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700"></span>
              <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-700"></span>
            </div>
          </div>

          {(hoveredSection === "testimonials" ||
            activeSection === "testimonials") && (
            <>
              <div className="absolute inset-0 rounded-sm ring-2 ring-primary"></div>
              <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs text-white">
                Testimonials (Click to Edit)
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-black">
      {/* Active section indicator */}
      {activeSection && (
        <div className="mb-3 rounded-md bg-primary/10 p-2 text-center shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
            <span className="text-sm font-medium text-primary">
              {activeSection === "testimonial_title" ? (
                <span>Editing Testimonial Title</span>
              ) : activeSection === "testimonial_subtitle" ? (
                <span>Editing Testimonial Subtitle</span>
              ) : activeSection === "testimonial_description" ? (
                <span>Editing Testimonial Description</span>
              ) : (
                <span>Editing Testimonials</span>
              )}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            Click on other sections to edit them
          </p>
        </div>
      )}

      {/* Preview mode toggle buttons */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white">
          Testimonial Section
        </h2>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => handlePreviewModeChange("desktop")}
            className={`rounded-md px-3 py-1 text-sm ${
              currentPreviewMode === "desktop"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => handlePreviewModeChange("mobile")}
            className={`rounded-md px-3 py-1 text-sm ${
              currentPreviewMode === "mobile"
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            Mobile
          </button>
        </div>
      </div>

      {/* Device mockup container */}
      <div className="mx-auto max-w-fit">
        {currentPreviewMode === "mobile" ? (
          /* Mobile Phone Mockup */
          <div className="mx-auto w-[350px]">
            <div className="relative overflow-hidden rounded-[36px] border-[14px] border-gray-900 bg-gray-900 shadow-xl">
              {/* Phone "notch" */}
              <div className="absolute left-1/2 top-0 z-10 h-6 w-40 -translate-x-1/2 rounded-b-lg bg-gray-900"></div>

              {/* Phone screen frame */}
              <div className="relative h-[650px] w-full overflow-hidden bg-white dark:bg-black">
                {/* Status bar */}
                <div className="sticky top-0 z-10 flex h-6 w-full items-center justify-between bg-gray-100 px-4 dark:bg-gray-800">
                  <div className="text-[10px] font-medium">9:41</div>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                    <div className="h-2 w-3 rounded-sm bg-gray-400"></div>
                  </div>
                </div>

                {/* Scrollable content area */}
                <div className="h-[644px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                  <div className="origin-top scale-[0.9] pb-12 pt-0">
                    {renderTestimonialContent()}
                  </div>
                </div>
              </div>

              {/* Home indicator */}
              <div className="absolute bottom-1 left-1/2 h-1 w-32 -translate-x-1/2 rounded-full bg-gray-300"></div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Mobile Preview • Scroll to see more content{"\n"}
              Hover over and click on any section to edit its content.
            </div>
          </div>
        ) : (
          /* Desktop Browser Mockup */
          <div className="mx-auto max-w-[900px]">
            <div className="overflow-hidden rounded-lg border border-gray-300 shadow-lg">
              {/* Browser toolbar */}
              <div className="flex h-10 items-center space-x-1.5 bg-gray-200 px-3 dark:bg-gray-800">
                {/* Window controls */}
                <div className="flex space-x-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>

                {/* URL bar */}
                <div className="ml-4 flex h-6 flex-1 items-center rounded-md bg-white px-3 dark:bg-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-2 h-4 w-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    brilian-eka-saetama.com/#testimonials
                  </span>
                </div>

                {/* Browser icons */}
                <div className="ml-4 flex space-x-2">
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                  <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                </div>
              </div>

              {/* Browser content */}
              <div className="h-fit max-h-[600px] min-h-[250px] overflow-y-auto overflow-x-hidden bg-white dark:bg-black">
                <div className="origin-top scale-[0.85] pb-5">
                  {renderTestimonialContent()}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-gray-500">
              Desktop Preview • Scroll to see more content{"\n"}
              Hover over and click on any section to edit its content.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestimonialPreview;
