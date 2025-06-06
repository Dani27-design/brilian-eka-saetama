"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import HeroPreview from "./HeroPreview";

const CollectionHero = ({ collectionName }) => {
  const [heroData, setHeroData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        setIsLoading(true);

        // Get all documents from the hero collection
        const querySnapshot = await getDocs(
          collection(firestore, collectionName),
        );
        const data = {};

        querySnapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });

        setHeroData(data);
      } catch (error) {
        console.error("Error fetching hero data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (collectionName === "hero") {
      fetchHeroData();
    }
  }, [collectionName]);

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 p-6">
        <h2 className="text-xl font-bold text-black dark:text-white">
          Hero Section
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/collections/hero/edit/hero_title`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Title
          </Link>
          <Link
            href={`/admin/collections/hero/edit/hero_subtitle`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Subtitle
          </Link>
          <Link
            href={`/admin/collections/hero/edit/hero_slogan`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Slogan
          </Link>
          <Link
            href={`/admin/collections/hero/edit/email_placeholder`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Form Placeholder
          </Link>
          <Link
            href={`/admin/collections/hero/edit/button_text`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Button Text
          </Link>
        </div>
      </div>

      <HeroPreview
        data={heroData}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
      />

      <div className="mt-4 border-t border-stroke p-4 dark:border-strokedark">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Use the buttons above to edit specific parts of the hero section.
        </p>
      </div>
    </div>
  );
};

export default CollectionHero;
