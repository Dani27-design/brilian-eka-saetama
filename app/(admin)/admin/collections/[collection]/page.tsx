"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { useLanguage } from "@/app/context/LanguageContext";
import { usePageHeader } from "@/app/context/PageHeaderContext";
import Link from "next/link";
import { firestore } from "@/db/firebase/firebaseConfig";

interface Document {
  id: string;
  data: any;
}

const collectionLabels: Record<string, { en: { title: string; description: string }; id: { title: string; description: string } }> = {
  header: {
    en: { title: "Header Section", description: "Manage the header area of your website" },
    id: { title: "Manajemen Website Bagian Header", description: "Kelola area header website Anda" },
  },
  hero: {
    en: { title: "Hero Section", description: "Manage the hero banner of your website" },
    id: { title: "Manajemen Website Bagian Hero", description: "Kelola banner utama website Anda" },
  },
  services: {
    en: { title: "Services Section", description: "Manage the services displayed on your website" },
    id: { title: "Manajemen Website Bagian Layanan", description: "Kelola layanan yang ditampilkan di website Anda" },
  },
  about: {
    en: { title: "About Section", description: "Manage the about section of your website" },
    id: { title: "Manajemen Website Bagian Tentang Kami", description: "Kelola bagian tentang di website Anda" },
  },
  clients: {
    en: { title: "Clients Section", description: "Manage client logos and information" },
    id: { title: "Manajemen Website Bagian Klien", description: "Kelola logo dan informasi klien" },
  },
  clientsInfo: {
    en: { title: "Client Satisfaction Section", description: "Manage client satisfaction statistics" },
    id: { title: "Manajemen Website Bagian Kepuasan Klien", description: "Kelola statistik kepuasan klien" },
  },
  faq: {
    en: { title: "FAQ Section", description: "Manage frequently asked questions" },
    id: { title: "Manajemen Website Bagian FAQ", description: "Kelola pertanyaan yang sering diajukan" },
  },
  testimonial: {
    en: { title: "Testimonial Section", description: "Manage client testimonials" },
    id: { title: "Manajemen Website Bagian Testimoni", description: "Kelola testimoni klien" },
  },
  contact: {
    en: { title: "Contact Section", description: "Manage contact information and form settings" },
    id: { title: "Manajemen Website Bagian Kontak", description: "Kelola informasi kontak dan pengaturan formulir" },
  },
  blog: {
    en: { title: "Blog Section", description: "Manage the blog section layout on your website" },
    id: { title: "Manajemen Website Bagian Blog", description: "Kelola tata letak bagian blog di website Anda" },
  },
  footer: {
    en: { title: "Footer Section", description: "Manage the footer area of your website" },
    id: { title: "Manajemen Website Bagian Footer", description: "Kelola area footer website Anda" },
  },
};

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

  const lang = (language as "en" | "id") || "en";
  const labels = collectionLabels[collectionName]?.[lang] || {
    title: `${collectionName} Collection`,
    description: `Manage all ${collectionName} content`,
  };

  usePageHeader(labels.title, labels.description);

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
      <div className="mb-6 flex items-center justify-end">
        <Link
          href={`/admin/collections/${collectionName}/create`}
          className="rounded-lg bg-primary px-4 py-2 text-white transition hover:bg-opacity-90"
        >
          Add New
        </Link>
      </div>

      <div className="mb-8">
        <div className="mt-4 flex items-center space-x-3 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2 pl-10 text-sm focus:border-primary focus:outline-none"
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
              className="h-24 animate-pulse rounded-lg bg-gray-200"
            ></div>
          ))}
        </div>
      ) : (
        <>
          {filteredDocs.length === 0 ? (
            <div className="rounded-lg border border-stroke bg-white p-8 text-center">
              <p className="text-gray-500">
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
                  className="overflow-hidden rounded-lg border border-stroke bg-white shadow-sm"
                >
                  <div className="border-b border-stroke bg-gray-50 px-6 py-4">
                    <h3
                      className="truncate font-medium text-black"
                      title={doc.id}
                    >
                      {doc.id}
                    </h3>
                  </div>
                  <div className="px-6 py-4">
                    <div className="mb-4 h-16 overflow-hidden text-sm text-gray-600">
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
