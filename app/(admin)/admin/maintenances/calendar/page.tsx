"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";
import { MaintenanceTableRow, loadMaintenancesWithRelatedData } from "@/utils/maintenanceDataLoader";
import { Maintenance } from "@/types/maintenances";
import { CalendarView } from "@/components/Admin/Maintenances/CalendarView";
import { usePageHeader } from "@/app/context/PageHeaderContext";

export default function MaintenanceCalendarPage() {
  usePageHeader("Kalender Maintenance", "Lihat jadwal maintenance dalam tampilan kalender");

  const [maintenances, setMaintenances] = useState<MaintenanceTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchMaintenances = async () => {
      try {
        setLoading(true);

        const maintenancesRef = collection(firestore, "maintenances");
        const q = query(maintenancesRef, orderBy("startDate", "desc"));

        const snapshot = await getDocs(q);
        const rawMaintenances = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startDate: doc.data().startDate,
          endDate: doc.data().endDate,
          createdAt: doc.data().createdAt,
          updatedAt: doc.data().updatedAt,
        })) as Maintenance[];

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
    <div className="flex h-full flex-col">
      {/* Calendar */}
      <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-white/80 bg-white shadow-sm">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <span className="text-sm text-gray-500">Memuat kalender...</span>
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
