"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import HeaderPreview from "./HeaderPreview";

const CollectionHeader = ({ collectionName }) => {
  const [headerData, setHeaderData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHeaderData = async () => {
      try {
        setIsLoading(true);

        // Get all documents from the header collection
        const querySnapshot = await getDocs(
          collection(firestore, collectionName),
        );
        const data = {};

        querySnapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });

        setHeaderData(data);
      } catch (error) {
        console.error("Error fetching header data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (collectionName === "header") {
      fetchHeaderData();
    }
  }, [collectionName]);

  if (collectionName !== "header" || isLoading) {
    return null;
  }

  return (
    <div className="mb-8 rounded-lg border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-black">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-black dark:text-white">
          Header Preview
        </h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/collections/header/edit/menu_items`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Menu Items
          </Link>
          <Link
            href={`/admin/collections/header/edit/logo_dark`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Dark Logo
          </Link>
          <Link
            href={`/admin/collections/header/edit/logo_light`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Light Logo
          </Link>
          <Link
            href={`/admin/collections/header/edit/language_dropdown`}
            className="rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
          >
            Edit Language
          </Link>
        </div>
      </div>

      <HeaderPreview data={headerData} />

      <div className="mt-4 border-t border-stroke p-4 dark:border-strokedark">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Use the buttons above to edit specific parts of the header.
        </p>
      </div>
    </div>
  );
};

export default CollectionHeader;
