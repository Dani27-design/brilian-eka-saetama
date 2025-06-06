"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import TextSkeleton from "../Skeleton/TextSkeleton";

export function HeroForm({ emailPlaceholder, buttonText }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-wrap gap-5">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="text"
          placeholder={emailPlaceholder}
          className="w-fit rounded-full border border-stroke px-6 py-2.5 focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black dark:focus:border-primary"
        />
        <button
          aria-label="get started button"
          className="rounded-full bg-black px-7.5 py-2.5 text-white dark:bg-btndark"
          type="submit"
        >
          {buttonText}
        </button>
      </div>
    </form>
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
