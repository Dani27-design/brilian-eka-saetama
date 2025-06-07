"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useLanguage } from "@/app/context/LanguageContext";
import AdminPageHeader from "@/components/Admin/AdminPageHeader";
import Link from "next/link";
import { firestore } from "@/db/firebase/firebaseConfig";

interface Document {
  id: string;
  data: any;
}

export default function CollectionPage({
  params,
}: {
  params: { collection: string };
}) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { language } = useLanguage();
  const router = useRouter();
  const { collection: collectionName } = params;

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(
          collection(firestore, collectionName),
        );
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }));
        setDocuments(docs);
      } catch (error) {
        console.error(`Error fetching ${collectionName} documents:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [collectionName]);

  const handleDelete = async (docId: string) => {
    try {
      await deleteDoc(doc(firestore, collectionName, docId));
      setDocuments(documents.filter((doc) => doc.id !== docId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error(`Error deleting document:`, error);
    }
  };

  // Filter documents based on search term
  const filteredDocs = documents.filter((doc) =>
    doc.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Function to get a preview of the document content
  const getDocumentPreview = (doc: Document) => {
    try {
      const content = doc.data[language] || doc.data;
      if (typeof content === "string") {
        return content.substring(0, 100) + (content.length > 100 ? "..." : "");
      }
      return JSON.stringify(content).substring(0, 100) + "...";
    } catch (e) {
      return "Unable to display preview";
    }
  };

  return (
    <div className="container mx-auto">
      <AdminPageHeader
        title={`${collectionName} Collection`}
        description={`Manage all ${collectionName} content`}
        actions={
          <Link
            href={`/admin/collections/${collectionName}/create`}
            className="rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-opacity-90"
          >
            Add New
          </Link>
        }
      />

      <div className="mb-8">
        <div className="mt-4 flex items-center space-x-3 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 pl-10 text-sm focus:border-primary focus:outline-none dark:border-strokedark dark:bg-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            ></div>
          ))}
        </div>
      ) : (
        <>
          {filteredDocs.length === 0 ? (
            <div className="rounded-lg border border-stroke bg-white p-8 text-center dark:border-strokedark dark:bg-black">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No documents match your search criteria."
                  : "No documents found in this collection."}
              </p>
              <Link
                href={`/admin/collections/${collectionName}/create`}
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-opacity-90"
              >
                Create First Document
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="overflow-hidden rounded-lg border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-black"
                >
                  <div className="border-b border-stroke bg-gray-50 px-6 py-4 dark:border-strokedark dark:bg-gray-800">
                    <h3
                      className="truncate font-medium text-black dark:text-white"
                      title={doc.id}
                    >
                      {doc.id}
                    </h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="mb-4 h-16 overflow-hidden text-sm text-gray-600 dark:text-gray-300">
                      {getDocumentPreview(doc)}
                    </div>
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/admin/collections/${collectionName}/edit/${doc.id}`}
                        className="text-blue-500 hover:underline"
                      >
                        Edit
                      </Link>

                      {deleteConfirm === doc.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-red-500 hover:underline"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-gray-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(doc.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
