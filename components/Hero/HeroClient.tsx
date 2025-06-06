"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import TextSkeleton from "../Skeleton/TextSkeleton";
import emailjs from "@emailjs/browser";

export function HeroForm({ emailPlaceholder, buttonText }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({
    type: null,
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address",
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
        subject: "Ingin Terhubung",
        message: `Pengunjung Website '${email.replace(
          /@.*/,
          "",
        )}' dari email '${email}' ingin terhubung dan konsultasi lebih lanjut.`,
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
        message: "Thank you for subscribing! We'll be in touch soon.",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      setSubmitStatus({
        type: "error",
        message: "Failed to submit your email. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear status message after 5 seconds
  useEffect(() => {
    if (submitStatus.type) {
      const timer = setTimeout(() => {
        setSubmitStatus({ type: null, message: "" });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-5">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="text"
            placeholder={emailPlaceholder}
            className="w-fit rounded-full border border-stroke px-6 py-2.5 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:focus:border-primary"
            disabled={isSubmitting}
          />
          <button
            aria-label="get started button"
            className={`rounded-full bg-black px-7.5 py-2.5 text-white dark:bg-btndark ${
              isSubmitting ? "cursor-not-allowed opacity-70" : ""
            }`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : buttonText}
          </button>
        </div>
      </form>

      {submitStatus.type && (
        <div
          className={`mt-3 rounded-md p-3 text-sm ${
            submitStatus.type === "success"
              ? "bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {submitStatus.message}
        </div>
      )}
    </div>
  );
}

export function HeroVideo() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "/videos/company_profile_bes_hero.mp4";

  const handleVideoLoad = () => {
    if (videoRef.current && videoRef.current.readyState >= 3) {
      setVideoLoaded(true);
    }
  };

  const handleVideoError = () => {
    console.error("Failed to load video");
    setVideoError(true);
  };

  useEffect(() => {
    const video = videoRef.current;
    const timer = setTimeout(() => {
      if (!videoLoaded && video) {
        handleVideoLoad();
      }
    }, 1000);

    if (video) {
      if (video.readyState >= 3) {
        setVideoLoaded(true);
      }

      video.addEventListener("loadeddata", handleVideoLoad);
      video.addEventListener("error", handleVideoError);
    }

    return () => {
      if (video) {
        video.removeEventListener("loadeddata", handleVideoLoad);
        video.removeEventListener("error", handleVideoError);
      }
      clearTimeout(timer);
    };
  }, [videoLoaded]);

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        aspectRatio: "3/4",
        width: "100%",
        height: "auto",
        minHeight: "400px",
        maxHeight: "600px",
        backgroundColor: "rgba(0,0,0,0.05)",
      }}
    >
      {!videoLoaded && (
        <div
          className="absolute inset-0 h-full w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700"
          style={{ zIndex: 1 }}
        />
      )}

      <video
        ref={videoRef}
        className={`h-full w-full object-cover shadow-solid-l ${
          videoLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transition: "opacity 0.5s ease",
          zIndex: videoLoaded ? 2 : 0,
        }}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
}
