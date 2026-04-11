"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { MaintenanceTableRow, loadMaintenancesWithRelatedData } from "@/utils/maintenanceDataLoader";
import { Maintenance } from "@/types/maintenances";
import { CalendarView } from "@/components/Admin/Maintenances/CalendarView";

export default function MaintenanceCalendarPage() {
  const [maintenances, setMaintenances] = useState<MaintenanceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchMaintenances = async () => {
      try {
        setLoading(true);
        
        // First fetch raw maintenances
        const maintenancesRef = collection(firestore, "maintenances");
        const q = query(
          maintenancesRef,
          orderBy("startDate", "desc")
        );
        
        const snapshot = await getDocs(q);
        const rawMaintenances = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate,
          endDate: doc.data().endDate,
          createdAt: doc.data().createdAt,
          updatedAt: doc.data().updatedAt,
        })) as Maintenance[];

        // Then enrich with related data
        const enrichedMaintenances = await loadMaintenancesWithRelatedData(rawMaintenances);
        setMaintenances(enrichedMaintenances);
      } catch (error) {
        console.error("Error fetching maintenances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenances();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kalender Maintenance
          </h1>
          <p className="text-sm text-gray-600">
            Lihat jadwal maintenance dalam tampilan kalender
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/maintenances"
            className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List View
          </Link>
          
          <Link
            href="/admin/maintenances/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Buat Jadwal
          </Link>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="rounded-lg border border-stroke bg-white shadow-sm">
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-sm text-gray-600">Memuat kalender...</span>
            </div>
          </div>
        ) : (
          <CalendarView
            maintenances={maintenances}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        )}
      </div>
    </div>
  );
}