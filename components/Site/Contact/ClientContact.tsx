"use client";

import React, { useEffect, useState, FormEvent, useMemo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useLanguage } from "@/app/context/LanguageContext";
import emailjs from "@emailjs/browser";

// Interface for contact data from server
interface ContactServerData {
  find_us: {
    title: string;
    location: {
      title: string;
      text: string;
    };
    email: {
      title: string;
      text: string;
    };
    phone: {
      title: string;
      text: string;
    };
  };
  send_message: {
    title: string;
    form: {
      name: { placeholder: string };
      email: { placeholder: string };
      subject: { placeholder: string };
      phone: { placeholder: string };
      message: { placeholder: string };
    };
    consent_text: string;
    submit_button: string;
  };
}

interface ContactProps {
  initialData: ContactServerData;
  initialLanguage: string;
}

const ClientContact = ({ initialData, initialLanguage }: ContactProps) => {
  const { language } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    phone: "",
    message: "",
  });
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  // Mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);

    // Simulate minimum loading time for smooth transition
    const timer = setTimeout(() => {
      setIsContentReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Prepare contact data for rendering
  const { contactInfo, messageForm } = useMemo(() => {
    return {
      contactInfo: initialData.find_us,
      messageForm: initialData.send_message,
    };
  }, [initialData]);

  /**
   * Handle form input changes
   */
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus({
        type: "error",
        message:
          language === "id"
            ? "Harap isi semua kolom yang diperlukan (nama, email, pesan)"
            : "Please fill in all required fields (name, email, message)",
      });
      return;
    }

    if (!consent) {
      setSubmitStatus({
        type: "error",
        message:
          language === "id"
            ? "Harap setuju dengan persyaratan sebelum mengirim"
            : "Please agree to the terms before submitting",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitStatus({
        type: "error",
        message:
          language === "id"
            ? "Harap masukkan alamat email yang valid"
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
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject || "Contact Form Submission",
        phone: formData.phone || "Not provided",
        message: formData.message,
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
          email: formData.email,
        },
        publicKey,
      );

      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        subject: "",
        phone: "",
        message: "",
      });
      setConsent(false);

      // Show success message
      setSubmitStatus({
        type: "success",
        message:
          language === "id"
            ? "Pesan Anda telah berhasil dikirim! Kami akan segera menghubungi Anda."
            : "Your message has been sent successfully! We'll get back to you soon.",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      setSubmitStatus({
        type: "error",
        message:
          language === "id"
            ? "Gagal mengirim pesan Anda. Silakan coba lagi nanti."
            : "Failed to send your message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle location click to open Google Maps
   */
  const handleLocationClick = () => {
    // Encode the address for the URL
    const encodedAddress = encodeURIComponent(contactInfo.location.text);
    // Create Google Maps URL with the address
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    // Open in a new tab
    window.open(googleMapsUrl, "_blank");
  };

  // Show loading state during brief transition to client
  if (isClient && !isContentReady) {
    return (
      <section id="contactus" className="my-10 py-0">
        <div className="relative mx-auto max-w-c-1280 px-7.5 pt-10 lg:px-15 lg:pt-15 xl:px-20 xl:pt-20">
          <div className="absolute left-0 top-0 -z-1 h-2/3 w-full rounded-lg bg-gradient-to-t from-transparent to-[#dee7ff47] dark:bg-gradient-to-t dark:to-[#252A42]"></div>
          <div className="flex flex-col-reverse flex-wrap gap-8 md:flex-row md:flex-nowrap md:justify-between xl:gap-20">
            <div className="w-full rounded-lg bg-white p-7.5 shadow-solid-8 dark:border dark:border-strokedark dark:bg-black md:w-3/5 lg:w-3/4 xl:p-15">
              <div className="mb-15 h-10 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-7.5 flex flex-col gap-7.5 lg:flex-row lg:justify-between lg:gap-14">
                <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="mb-7.5 flex flex-col gap-7.5 lg:flex-row lg:justify-between lg:gap-14">
                <div className="h-10 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
            <div className="w-full md:w-2/5 md:p-7.5 lg:w-[26%] xl:pt-15">
              <div className="mb-12.5 h-10 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-7">
                <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
              <div className="mb-7">
                <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contactus" className="my-10 py-0">
      <div className="relative mx-auto max-w-c-1280 px-7.5 pt-10 lg:px-15 lg:pt-15 xl:px-20 xl:pt-20">
        <div className="absolute left-0 top-0 -z-1 h-2/3 w-full rounded-lg bg-gradient-to-t from-transparent to-[#dee7ff47] dark:bg-gradient-to-t dark:to-[#252A42]"></div>
        <div className="absolute bottom-[-255px] left-0 -z-1 h-full w-full">
          {isClient && (
            <>
              <Image
                src="./images/shape/shape-dotted-light.svg"
                alt="Dotted"
                className="dark:hidden"
                fill
                priority={true}
                quality={80}
                loading="eager"
              />
              <Image
                src="./images/shape/shape-dotted-dark.svg"
                alt="Dotted"
                className="hidden dark:block"
                fill
                priority={true}
                quality={80}
                loading="eager"
              />
            </>
          )}
        </div>

        <div className="flex flex-col-reverse flex-wrap gap-8 md:flex-row md:flex-nowrap md:justify-between xl:gap-20">
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
            className="animate_top w-full rounded-lg bg-white p-7.5 shadow-solid-8 dark:border dark:border-strokedark dark:bg-black md:w-3/5 lg:w-3/4 xl:p-15"
          >
            <h2 className="mb-15 text-3xl font-semibold text-black dark:text-white xl:text-sectiontitle2">
              {messageForm.title}
            </h2>

            {/* Status message display */}
            {submitStatus.type && (
              <div
                className={`mb-6 rounded-md p-4 ${
                  submitStatus.type === "success"
                    ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {submitStatus.message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-7.5 flex flex-col gap-7.5 lg:flex-row lg:justify-between lg:gap-14">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={messageForm.form.name.placeholder}
                  className="w-full border-b border-stroke bg-transparent pb-3.5 focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white lg:w-1/2"
                />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={messageForm.form.email.placeholder}
                  className="w-full border-b border-stroke bg-transparent pb-3.5 focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white lg:w-1/2"
                />
              </div>

              <div className="mb-12.5 flex flex-col gap-7.5 lg:flex-row lg:justify-between lg:gap-14">
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder={messageForm.form.subject.placeholder}
                  className="w-full border-b border-stroke bg-transparent pb-3.5 focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white lg:w-1/2"
                />

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={messageForm.form.phone.placeholder}
                  className="w-full border-b border-stroke bg-transparent pb-3.5 focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white lg:w-1/2"
                />
              </div>

              <div className="mb-11.5 flex">
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={messageForm.form.message.placeholder}
                  rows={4}
                  className="w-full border-b border-stroke bg-transparent focus:border-waterloo focus:placeholder:text-black focus-visible:outline-none dark:border-strokedark dark:focus:border-manatee dark:focus:placeholder:text-white"
                ></textarea>
              </div>

              <div className="flex flex-wrap gap-4 xl:justify-between">
                <div className="mb-4 flex md:mb-0">
                  <div className="relative flex items-center">
                    <input
                      id="default-checkbox"
                      type="checkbox"
                      checked={consent}
                      onChange={() => setConsent(!consent)}
                      className="peer sr-only"
                    />
                    <span
                      onClick={() => setConsent(!consent)}
                      className={`group mt-2 flex h-5 min-w-[20px] cursor-pointer items-center justify-center rounded border border-gray-300 bg-gray-100 text-blue-600 ${
                        consent ? "bg-primary" : ""
                      } dark:border-gray-600 dark:bg-gray-700`}
                    >
                      <svg
                        className={`${
                          consent ? "opacity-100" : "opacity-0"
                        } peer-checked:group-[]:opacity-100`}
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M9.70704 0.792787C9.89451 0.980314 9.99983 1.23462 9.99983 1.49979C9.99983 1.76495 9.89451 2.01926 9.70704 2.20679L4.70704 7.20679C4.51951 7.39426 4.26521 7.49957 4.00004 7.49957C3.73488 7.49957 3.48057 7.39426 3.29304 7.20679L0.293041 4.20679C0.110883 4.01818 0.0100885 3.76558 0.0123669 3.50339C0.0146453 3.24119 0.119814 2.99038 0.305222 2.80497C0.490631 2.61956 0.741443 2.51439 1.00364 2.51211C1.26584 2.50983 1.51844 2.61063 1.70704 2.79279L4.00004 5.08579L8.29304 0.792787C8.48057 0.605316 8.73488 0.5 9.00004 0.5C9.26521 0.5 9.51951 0.605316 9.70704 0.792787Z"
                          fill="white"
                        />
                      </svg>
                    </span>
                    <label
                      htmlFor="default-checkbox"
                      className="flex max-w-[425px] cursor-pointer select-none pl-5"
                    >
                      {messageForm.consent_text}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !consent}
                  aria-label="send message"
                  className={`inline-flex items-center gap-2.5 rounded-full bg-black px-6 py-3 font-medium text-white duration-300 ease-in-out hover:bg-blackho dark:bg-btndark ${
                    isSubmitting || !consent
                      ? "cursor-not-allowed opacity-70"
                      : ""
                  }`}
                >
                  {isSubmitting
                    ? language === "id"
                      ? "Mengirim..."
                      : "Sending..."
                    : messageForm.submit_button}
                  {!isSubmitting && (
                    <svg
                      className="fill-white"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10.4767 6.16664L6.00668 1.69664L7.18501 0.518311L13.6667 6.99998L7.18501 13.4816L6.00668 12.3033L10.4767 7.83331H0.333344V6.16664H10.4767Z"
                        fill=""
                      />
                    </svg>
                  )}
                </button>
              </div>
            </form>
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
            transition={{ duration: 2, delay: 0.1 }}
            viewport={{ once: true }}
            className="animate_top w-full md:w-2/5 md:p-7.5 lg:w-[26%] xl:pt-15"
          >
            <h2 className="mb-12.5 text-3xl font-semibold text-black dark:text-white xl:text-sectiontitle2">
              {contactInfo.title}
            </h2>

            {/* Location section */}
            <div className="mb-7">
              <h3
                onClick={handleLocationClick}
                className="mb-4 cursor-pointer text-metatitle3 font-medium text-black hover:text-primary dark:text-white dark:hover:text-primary"
              >
                {contactInfo.location.title}
              </h3>
              <p
                onClick={handleLocationClick}
                className="cursor-pointer hover:text-primary dark:hover:text-primary"
              >
                {contactInfo.location.text}
              </p>
            </div>

            {/* Email section */}
            <div className="mb-7">
              <h3 className="mb-4 text-metatitle3 font-medium text-black dark:text-white">
                {contactInfo.email.title}
              </h3>
              <p>{contactInfo.email.text}</p>
            </div>

            {/* Phone section */}
            <div>
              <h4 className="mb-4 text-metatitle3 font-medium text-black dark:text-white">
                {contactInfo.phone.title}
              </h4>
              <p className="cursor-pointer hover:text-primary dark:hover:text-primary">
                <a
                  href={`https://wa.me/6285231600808?text=${
                    language === "id"
                      ? "Halo%20PT%20Brilian%20Eka%20Saetama,%20saya%20ingin%20konsultasi%20tentang%20layanan%20keamanan%20kebakaran."
                      : "Hello%20PT%20Brilian%20Eka%20Saetama,%20I%20would%20like%20to%20consult%20about%20fire%20safety%20services."
                  }`}
                >
                  {contactInfo.phone.text}
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ClientContact;
