"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  DocumentReference,
} from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  productNumber: string;
  brand: string;
  brandType: string;
  weight: string;
  height: string;
  width: string;
  productType: string;
  imageUrl?: string;
  createdAt?: Timestamp;
  createdBy?: DocumentReference; // Reference to user document
  updatedAt?: Timestamp;
  updatedBy?: DocumentReference;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(firestore, "products"));
      const data: Product[] = [];
      querySnapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(data);
    } catch (err) {
      setError("Gagal memuat produk");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, brandFilter]);

  // Unique product types and brands for filter options
  const productTypes = Array.from(
    new Set(products.map((p) => p.productType).filter(Boolean)),
  );
  const brands = Array.from(
    new Set(products.map((p) => p.brand).filter(Boolean)),
  );

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = (
      p.name +
      p.productNumber +
      p.brand +
      p.brandType +
      p.productType
    )
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || p.productType === typeFilter;
    const matchesBrand = !brandFilter || p.brand === brandFilter;
    return matchesSearch && matchesType && matchesBrand;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  // Delete product
  const handleDelete = async (id: string) => {
    if (window.confirm("Hapus produk ini?")) {
      try {
        await deleteDoc(doc(firestore, "products", id));
        setProducts(products.filter((p) => p.id !== id));
      } catch {
        setError("Gagal menghapus produk");
      }
    }
  };

  // Reset filters
  const resetFilters = () => {
    setTypeFilter(null);
    setBrandFilter(null);
    setSearchTerm("");
  };

  return (
    <div className="shadow-default rounded-sm border border-stroke bg-white p-4 md:p-6 xl:p-7.5">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Manajemen Produk</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola data produk</p>
        </div>
        <Link
          href="/admin/products/create"
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 sm:mt-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Produk
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Filter section */}
      <div className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search field */}
          <div className="w-full sm:w-64">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Cari produk...
            </label>
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-stroke px-4 py-2 outline-none focus:border-primary"
            />
          </div>
          {/* Product Type filter */}
          <div className="w-full sm:w-auto">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Filter Tipe Produk
            </label>
            <select
              value={typeFilter || ""}
              onChange={(e) => setTypeFilter(e.target.value || null)}
              className="w-full rounded-lg border border-stroke px-4 py-2 outline-none focus:border-primary"
            >
              <option value="">Semua Tipe</option>
              {productTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          {/* Brand filter */}
          <div className="w-full sm:w-auto">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Filter Merk
            </label>
            <select
              value={brandFilter || ""}
              onChange={(e) => setBrandFilter(e.target.value || null)}
              className="w-full rounded-lg border border-stroke px-4 py-2 outline-none focus:border-primary"
            >
              <option value="">Semua Merk</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
          {/* Filter actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="rounded-lg border border-stroke px-4 py-2 text-xs font-medium hover:bg-gray-100"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-stroke bg-white p-4">
        {isLoading ? (
          <div className="py-8 text-center">Memuat produk...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-8 text-center">Tidak ada produk.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-black">
                    <th className="px-4 py-3">Gambar</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">No. Produk</th>
                    <th className="px-4 py-3">Merk</th>
                    <th className="px-4 py-3">Jenis</th>
                    <th className="px-4 py-3">Berat</th>
                    <th className="px-4 py-3">Tinggi</th>
                    <th className="px-4 py-3">Lebar</th>
                    <th className="px-4 py-3">Tipe Produk</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="text-sm">
                      <td className="px-4 py-3">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="rounded object-cover"
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{product.name}</td>
                      <td className="px-4 py-3">{product.productNumber}</td>
                      <td className="px-4 py-3">{product.brand}</td>
                      <td className="px-4 py-3">{product.brandType}</td>
                      <td className="px-4 py-3">
                        {product.weight}
                        {" kg"}
                      </td>
                      <td className="px-4 py-3">
                        {product.height}
                        {" cm"}
                      </td>
                      <td className="px-4 py-3">
                        {product.width}
                        {" cm"}
                      </td>
                      <td className="px-4 py-3">{product.productType}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/products/edit/${product.id}`}
                            className="flex w-18 items-center justify-center rounded-lg bg-blue-200 px-1.5 py-1.5 text-xs font-medium text-gray-800 transition-colors hover:bg-yellow-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="mr-1 h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6"
                              />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="flex w-18 items-center justify-center rounded-lg border border-red-300 bg-white px-1.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="mr-1 h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col items-center justify-between space-y-3 border-t pt-4 sm:flex-row sm:space-y-0">
              <div className="text-xs text-gray-600">
                Menampilkan {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, filteredProducts.length)} dari{" "}
                {filteredProducts.length} produk
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Item per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === 1
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  &lt;
                </button>
                <span className="text-sm text-gray-600">
                  Halaman <span className="font-medium">{currentPage}</span>{" "}
                  dari {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm ${
                    currentPage === totalPages || totalPages === 0
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-stroke bg-white hover:bg-gray-100"
                  }`}
                >
                  &gt;
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
