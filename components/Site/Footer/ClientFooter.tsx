"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState, FormEvent, useMemo } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import emailjs from "@emailjs/browser";

// Interface for footer data structure
interface FooterData {
  logo: {
    light_logo: string;
    dark_logo: string;
    description: string;
    contact_label: string;
    contact_email: string;
  };
  quick_links: {
    title: string;
    links: Array<{ name: string; url: string }>;
  };
  support: {
    title: string;
    links: Array<{ name: string; url: string }>;
  };
  newsletter: {
    title: string;
    description: string;
    placeholder: string;
  };
  bottom: {
    language_selector: string;
    links: Array<{ name: string; url: string }>;
    copyright: string;
    social_media: Array<{ name: string; url: string }>;
  };
}

// Interface for footer data from server
interface FooterProps {
  initialData: FooterData;
  initialLanguage: string;
}

const ClientFooter = ({ initialData, initialLanguage }: FooterProps) => {
  const { language } = useLanguage();
  const [hasMounted, setHasMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  // Prepare footer data from initialData
  const footer = useMemo<FooterData>(() => {
    return initialData;
  }, [initialData]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Clear status message after 5 seconds
  useEffect(() => {
    if (submitStatus.type) {
      const timer = setTimeout(() => {
        setSubmitStatus({ type: null, message: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  /**
   * Handle newsletter form submission
   */
  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setSubmitStatus({
        type: "error",
        message:
          language === "id"
            ? "Silakan masukkan alamat email yang valid"
            : "Please enter a valid email address",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateIdInboundConsultation =
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_INBOUND_CONSULTATION;
      const templateIdOutbondWelcome =
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_OUTBOUND_WELCOME;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      // Validate EmailJS credentials exist
      if (
        !serviceId ||
        !templateIdInboundConsultation ||
        !publicKey ||
        !templateIdOutbondWelcome
      ) {
        throw new Error("EmailJS credentials are not properly configured");
      }

      // Prepare template parameters for EmailJS
      const templateParams = {
        to_email: "ptbrilianekasaetama@gmail.com",
        from_name: email.replace(/@.*/, ""),
        from_email: email,
        subject:
          language === "id"
            ? "Ingin Berlangganan Informasi"
            : "Newsletter Subscription",
        message:
          language === "id"
            ? `Pengunjung Website '${email.replace(
                /@.*/,
                "",
              )}' dari email '${email}' ingin selalu mendapatkan informasi terbaru.`
            : `Website visitor '${email.replace(
                /@.*/,
                "",
              )}' from email '${email}' wants to receive the latest information.`,
      };

      // Send email using EmailJS
      await emailjs.send(
        serviceId,
        templateIdInboundConsultation,
        templateParams,
        publicKey,
      );

      await emailjs.send(
        serviceId,
        templateIdOutbondWelcome,
        {
          email: email,
        },
        publicKey,
      );

      // Reset form after successful submission
      setEmail("");

      // Show success message
      setSubmitStatus({
        type: "success",
        message:
          language === "id"
            ? "Terima kasih telah berlangganan newsletter kami!"
            : "Thank you for subscribing to our newsletter!",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      setSubmitStatus({
        type: "error",
        message:
          language === "id"
            ? "Gagal mengirimkan permintaan Anda. Silakan coba lagi nanti."
            : "Failed to submit your request. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasMounted) {
    return null;
  }

  /**
   * Handle mailto contact email with EmailJS instead of default email client
   */
  const handleContactEmailClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Open a modal or prompt user for their email information
    const userEmail = prompt(
      language === "id"
        ? "Silakan masukkan email Anda:"
        : "Please enter your email:",
    );

    if (!userEmail) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      alert(
        language === "id"
          ? "Silakan masukkan alamat email yang valid"
          : "Please enter a valid email address",
      );
      return;
    }

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId =
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID_INBOUND_CONSULTATION;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error("EmailJS credentials are not properly configured");
      }

      // Prepare template parameters
      const templateParams = {
        to_email: "ptbrilianekasaetama@gmail.com",
        from_name: userEmail.replace(/@.*/, ""),
        from_email: userEmail,
        subject: language === "id" ? "Ingin Terhubung" : "Connect Request",
        message:
          language === "id"
            ? `Pengunjung Website '${userEmail.replace(
                /@.*/,
                "",
              )}' dari email '${userEmail}' ingin terhubung dan konsultasi lebih lanjut.`
            : `Website visitor '${userEmail.replace(
                /@.*/,
                "",
              )}' from email '${userEmail}' wants to connect and get further consultation.`,
      };

      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      alert(
        language === "id"
          ? "Permintaan kontak Anda telah dikirim!"
          : "Your contact request has been sent!",
      );
    } catch (error) {
      console.error("Error sending email:", error);
      alert(
        language === "id"
          ? "Gagal mengirim permintaan Anda. Silakan gunakan email langsung sebagai gantinya."
          : "Failed to send your request. Please try using direct email instead.",
      );
    }
  };

  return (
    <>
      <footer className="border-t border-stroke bg-white dark:border-strokedark dark:bg-blacksection">
        <div className="mx-auto max-w-c-1280 px-4 md:px-8 2xl:px-0">
          {/* <!-- Footer Top --> */}
          <div className="py-10 lg:py-16">
            <div className="flex flex-wrap gap-8 lg:justify-between lg:gap-0">
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
                transition={{ duration: 1, delay: 0.5 }}
                viewport={{ once: true }}
                className="animate_top w-full sm:w-1/2 lg:w-1/4"
              >
                <a href="/" className="relative inline-block">
                  <Image
                    width={55}
                    height={54}
                    src={footer.logo.light_logo}
                    alt="Logo"
                    className="dark:hidden"
                    priority={true}
                    quality={80}
                    loading="eager"
                    style={{
                      cursor: "pointer",
                      width: "auto",
                      height: "auto",
                    }}
                  />
                  <Image
                    width={55}
                    height={54}
                    src={footer.logo.dark_logo}
                    alt="Logo"
                    className="hidden dark:block"
                    priority={true}
                    quality={80}
                    loading="eager"
                    style={{
                      cursor: "pointer",
                      width: "auto",
                      height: "auto",
                    }}
                  />
                </a>

                <p className="mb-8 mt-5 max-w-[280px] text-base">
                  {footer.logo.description}
                </p>

                <p className="mb-1.5 text-sectiontitle uppercase tracking-[5px]">
                  {footer.logo.contact_label}
                </p>
                <a
                  href="#"
                  onClick={handleContactEmailClick}
                  className="font-bolder break-words font-medium text-black dark:text-white"
                >
                  {footer.logo.contact_email}
                </a>
              </motion.div>

              <div className="flex w-full flex-col gap-8 md:flex-row md:justify-between md:gap-0 lg:w-2/3 xl:w-7/12">
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
                  className="animate_top"
                >
                  <h4 className="mb-6 text-itemtitle2 font-medium text-black dark:text-white">
                    {footer.quick_links.title}
                  </h4>

                  <ul>
                    {footer.quick_links.links.map((link, index) => (
                      <li key={`quick-link-${index}`}>
                        <a
                          href={link.url}
                          className="mb-3 inline-block hover:text-primary"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

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
                  className="animate_top"
                >
                  <h4 className="mb-6 text-itemtitle2 font-medium text-black dark:text-white">
                    {footer.support.title}
                  </h4>

                  <ul>
                    {footer.support.links.map((link, index) => (
                      <li key={`support-link-${index}`}>
                        <a
                          href={link.url}
                          className="mb-3 inline-block hover:text-primary"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

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
                  className="animate_top"
                >
                  <h4 className="mb-6 text-itemtitle2 font-medium text-black dark:text-white">
                    {footer.newsletter.title}
                  </h4>
                  <p className="mb-4 max-w-[280px]">
                    {footer.newsletter.description}
                  </p>

                  <form
                    onSubmit={handleNewsletterSubmit}
                    className="max-w-[280px]"
                  >
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={footer.newsletter.placeholder}
                        className="w-full rounded-full border border-stroke px-6 py-3 shadow-solid-11 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:shadow-none dark:focus:border-primary"
                        disabled={isSubmitting}
                      />

                      <button
                        type="submit"
                        aria-label="signup to newsletter"
                        className="absolute right-0 p-4"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg
                            className="fill-[#757693] hover:fill-primary dark:fill-white"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g clipPath="url(#clip0_48_1487)">
                              <path
                                d="M3.1175 1.17318L18.5025 9.63484C18.5678 9.67081 18.6223 9.72365 18.6602 9.78786C18.6982 9.85206 18.7182 9.92527 18.7182 9.99984C18.7182 10.0744 18.6982 10.1476 18.6602 10.2118C18.6223 10.276 18.5678 10.3289 18.5025 10.3648L3.1175 18.8265C3.05406 18.8614 2.98262 18.8792 2.91023 18.8781C2.83783 18.8769 2.76698 18.857 2.70465 18.8201C2.64232 18.7833 2.59066 18.7308 2.55478 18.6679C2.51889 18.6051 2.50001 18.5339 2.5 18.4615V1.53818C2.50001 1.46577 2.51889 1.39462 2.55478 1.33174C2.59066 1.26885 2.64232 1.2164 2.70465 1.17956C2.76698 1.14272 2.83783 1.12275 2.91023 1.12163C2.98262 1.12051 3.05406 1.13828 3.1175 1.17318ZM4.16667 10.8332V16.3473L15.7083 9.99984L4.16667 3.65234V9.16651H8.33333V10.8332H4.16667Z"
                                fill=""
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_48_1487">
                                <rect width="20" height="20" fill="white" />
                              </clipPath>
                            </defs>
                          </svg>
                        )}
                      </button>
                    </div>

                    {submitStatus.type && (
                      <div
                        className={`mt-3 rounded-md p-2 text-sm ${
                          submitStatus.type === "success"
                            ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {submitStatus.message}
                      </div>
                    )}
                  </form>
                </motion.div>
              </div>
            </div>
          </div>
          {/* <!-- Footer Top --> */}

          {/* <!-- Footer Bottom --> */}
          <div className="flex flex-col flex-wrap items-center justify-center gap-5 border-t border-stroke py-7 dark:border-strokedark lg:flex-row lg:justify-between lg:gap-0">
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
              className="animate_top w-full overflow-x-auto lg:w-auto"
            >
              <ul className="flex items-center justify-center gap-4 md:gap-8 lg:justify-start">
                <li>
                  <a href="#" className="whitespace-nowrap hover:text-primary">
                    {footer.bottom.language_selector}
                  </a>
                </li>
                {footer.bottom.links.map((link, index) => (
                  <li key={`bottom-link-${index}`}>
                    <a
                      href={link.url}
                      className="whitespace-nowrap hover:text-primary"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>

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
              className="animate_top text-center"
            >
              <p className="text-sm md:text-base">{footer.bottom.copyright}</p>
            </motion.div>

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
              className="animate_top"
            >
              <ul className="flex flex-wrap items-center justify-center gap-5">
                {footer.bottom.social_media.map((social, index) => (
                  <li key={`social-${index}`}>
                    <a href={social.url} aria-label={social.name}>
                      {/* Social icons remain the same since they're SVG elements */}
                      {index === 0 && (
                        <svg
                          className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_48_1499)">
                            <path
                              d="M14 13.5H16.5L17.5 9.5H14V7.5C14 6.47 14 5.5 16 5.5H17.5V2.14C17.174 2.097 15.943 2 14.643 2C11.928 2 10 3.657 10 6.7V9.5H7V13.5H10V22H14V13.5Z"
                              fill=""
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_48_1499">
                              <rect width="24" height="24" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                      {index === 1 && (
                        <svg
                          className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_48_1502)">
                            <path
                              d="M22.162 5.65593C21.3985 5.99362 20.589 6.2154 19.76 6.31393C20.6337 5.79136 21.2877 4.96894 21.6 3.99993C20.78 4.48793 19.881 4.82993 18.944 5.01493C18.3146 4.34151 17.4803 3.89489 16.5709 3.74451C15.6615 3.59413 14.7279 3.74842 13.9153 4.18338C13.1026 4.61834 12.4564 5.30961 12.0771 6.14972C11.6978 6.98983 11.6067 7.93171 11.818 8.82893C10.1551 8.74558 8.52832 8.31345 7.04328 7.56059C5.55823 6.80773 4.24812 5.75098 3.19799 4.45893C2.82628 5.09738 2.63095 5.82315 2.63199 6.56193C2.63199 8.01193 3.36999 9.29293 4.49199 10.0429C3.828 10.022 3.17862 9.84271 2.59799 9.51993V9.57193C2.59819 10.5376 2.93236 11.4735 3.54384 12.221C4.15532 12.9684 5.00647 13.4814 5.95299 13.6729C5.33661 13.84 4.6903 13.8646 4.06299 13.7449C4.32986 14.5762 4.85 15.3031 5.55058 15.824C6.25117 16.345 7.09712 16.6337 7.96999 16.6499C7.10247 17.3313 6.10917 17.8349 5.04687 18.1321C3.98458 18.4293 2.87412 18.5142 1.77899 18.3819C3.69069 19.6114 5.91609 20.2641 8.18899 20.2619C15.882 20.2619 20.089 13.8889 20.089 8.36193C20.089 8.18193 20.084 7.99993 20.076 7.82193C20.8949 7.2301 21.6016 6.49695 22.163 5.65693L22.162 5.65593Z"
                              fill=""
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_48_1502">
                              <rect width="24" height="24" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                      {index === 2 && (
                        <svg
                          className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_48_1505)">
                            <path
                              d="M6.94 5.00002C6.93974 5.53046 6.72877 6.03906 6.35351 6.41394C5.97825 6.78883 5.46944 6.99929 4.939 6.99902C4.40857 6.99876 3.89997 6.78779 3.52508 6.41253C3.1502 6.03727 2.93974 5.52846 2.94 4.99802C2.94027 4.46759 3.15124 3.95899 3.5265 3.5841C3.90176 3.20922 4.41057 2.99876 4.941 2.99902C5.47144 2.99929 5.98004 3.21026 6.35492 3.58552C6.72981 3.96078 6.94027 4.46959 6.94 5.00002ZM7 8.48002H3V21H7V8.48002ZM13.32 8.48002H9.34V21H13.28V14.43C13.28 10.77 18.05 10.43 18.05 14.43V21H22V13.07C22 6.90002 14.94 7.13002 13.28 10.16L13.32 8.48002Z"
                              fill=""
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_48_1505">
                              <rect width="24" height="24" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                      {index === 3 && (
                        <svg
                          className="fill-[#D1D8E0] transition-all duration-300 hover:fill-primary"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_48_1508)">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </g>
                          <defs>
                            <clipPath id="clip0_48_1508">
                              <rect width="24" height="24" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          {/* <!-- Footer Bottom --> */}
        </div>
      </footer>
    </>
  );
};

export default ClientFooter;
