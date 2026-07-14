"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Modal from "@/components/Admin/Modal";
import { MaintenanceTableRow } from "@/utils/maintenanceDataLoader";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface CalendarViewProps {
  maintenances: MaintenanceTableRow[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const statusColor: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  pending: "bg-gray-100 text-gray-700",
  in_progress: "bg-purple-100 text-purple-700",
  waiting_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const statusDisplay: Record<string, string> = {
  scheduled: "Dijadwalkan",
  pending: "Tertunda",
  in_progress: "Sedang Dikerjakan",
  waiting_approval: "Menunggu Disetujui",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export function CalendarView({ maintenances, selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [modalDate, setModalDate] = useState<Date | null>(null);

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // Get first day of week (Sunday = 0, Monday = 1, etc.)
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Get last day of calendar grid
    const endDate = new Date(end);
    const daysToAdd = 6 - endDate.getDay();
    endDate.setDate(endDate.getDate() + daysToAdd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Group maintenances by startDate — each maintenance shows on its start date only
  const maintenancesByDate = useMemo(() => {
    const grouped: Record<string, MaintenanceTableRow[]> = {};

    const visibleStart = calendarDays[0];
    const visibleEnd = calendarDays[calendarDays.length - 1];

    maintenances.forEach(maintenance => {
      if (!maintenance.startDate) return;

      const mStart = maintenance.startDate instanceof Date
        ? maintenance.startDate
        : new Date(maintenance.startDate as any);

      // Only include if startDate falls within the visible calendar range
      if (mStart.getTime() < visibleStart.getTime() || mStart.getTime() > visibleEnd.getTime()) return;

      const dateKey = format(mStart, "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(maintenance);
    });

    return grouped;
  }, [maintenances, calendarDays]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev => direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedMaintenances = maintenancesByDate[selectedDateKey] || [];

  return (
    <div className="styled-scrollbar flex-1 overflow-y-auto px-4 py-3">
      {/* Calendar Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900">
            {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
          </h2>

          <div className="flex gap-1">
            <button
              onClick={() => navigateMonth("prev")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke bg-white hover:bg-blue-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={() => navigateMonth("next")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke bg-white hover:bg-blue-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Hari Ini
          </button>
          <Link
            href="/admin/maintenances"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-stroke bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </Link>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(day => (
          <div
            key={day}
            className="flex h-10 items-center justify-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map(day => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayMaintenances = maintenancesByDate[dateKey] || [];
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          // Group by contract with per-status product counts
          const statusPriority: Record<string, number> = {
            rejected: 6, waiting_approval: 5, in_progress: 4, pending: 3, scheduled: 2, approved: 1,
          };
          const pillStatusLabel: Record<string, string> = {
            approved: "disetujui", scheduled: "dijadwalkan", in_progress: "dikerjakan",
            waiting_approval: "menunggu persetujuan", pending: "tertunda", rejected: "ditolak",
          };
          const contractGroups: Record<string, { name: string; dominantStatus: string; statusCounts: Record<string, number> }> = {};
          dayMaintenances.forEach(m => {
            const key = m.contractNumber || "unknown";
            if (!contractGroups[key]) {
              contractGroups[key] = { name: m.contractName || key, dominantStatus: m.status, statusCounts: {} };
            } else if ((statusPriority[m.status] || 0) > (statusPriority[contractGroups[key].dominantStatus] || 0)) {
              contractGroups[key].dominantStatus = m.status;
            }
            contractGroups[key].statusCounts[m.status] = (contractGroups[key].statusCounts[m.status] || 0) + 1;
          });
          const groupedContracts = Object.values(contractGroups).map(g => {
            const total = Object.values(g.statusCounts).reduce((a, b) => a + b, 0);
            const statuses = Object.keys(g.statusCounts);
            let summary: string;
            if (statuses.length === 1) {
              summary = `${total} produk ${pillStatusLabel[statuses[0]] || statuses[0]}`;
            } else {
              summary = Object.entries(g.statusCounts)
                .sort(([a], [b]) => (statusPriority[b] || 0) - (statusPriority[a] || 0))
                .map(([s, count]) => `${count} ${pillStatusLabel[s] || s}`)
                .join(", ");
            }
            return { ...g, summary };
          });

          return (
            <div
              key={day.toString()}
              className={`min-h-[5rem] cursor-pointer border border-stroke p-1 hover:bg-blue-50/50 ${
                isSelected ? "bg-blue-50" : ""
              } ${!isCurrentMonth ? "bg-gray-50/50" : ""}`}
              onClick={() => {
                onDateSelect(day);
                const dateKey = format(day, "yyyy-MM-dd");
                if ((maintenancesByDate[dateKey] || []).length > 0) {
                  setModalDate(day);
                }
              }}
            >
              <div className="flex flex-col">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded text-sm ${
                    isToday
                      ? "bg-primary text-white"
                      : isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                  }`}
                >
                  {format(day, "d")}
                </div>

                {/* Contract indicators */}
                <div className="mt-1 space-y-0.5">
                  {groupedContracts.slice(0, 2).map((contract, idx) => (
                    <div
                      key={idx}
                      className={`rounded px-1 py-0.5 text-xs leading-tight ${statusColor[contract.dominantStatus] || "bg-gray-100 text-gray-700"}`}
                    >
                      {contract.name} - {contract.summary}
                    </div>
                  ))}

                  {groupedContracts.length > 2 && (
                    <div className="text-xs text-gray-400">
                      +{groupedContracts.length - 2} kontrak
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      <Modal
        isOpen={modalDate !== null}
        onClose={() => setModalDate(null)}
        title={modalDate ? `Maintenance — ${format(modalDate, "dd MMMM yyyy", { locale: idLocale })}` : ""}
      >
        {modalDate && (maintenancesByDate[format(modalDate, "yyyy-MM-dd")] || []).length > 0 && (
          <div className="styled-scrollbar max-h-[60vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white shadow-[inset_0_-2px_0_0_#bfdbfe]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                  <th className="px-3 py-2">Kontrak</th>
                  <th className="px-3 py-2">Produk</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke">
                {(maintenancesByDate[format(modalDate, "yyyy-MM-dd")] || []).map(maintenance => (
                  <tr key={maintenance.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">{maintenance.contractName}</div>
                      <div className="text-xs text-gray-500">{maintenance.contractNumber}</div>
                      {maintenance.referenceStatus?.contract !== "valid" && (
                        <span className="mt-1 inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Referensi kontrak tidak valid
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-900">{maintenance.productName}</div>
                      <div className="text-xs text-gray-500">{maintenance.productNumber}</div>
                      {maintenance.referenceStatus?.product !== "valid" && (
                        <span className="mt-1 inline-flex rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                          Referensi produk tidak valid
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        statusColor[maintenance.status] || "bg-gray-100 text-gray-700"
                      }`}>
                        {statusDisplay[maintenance.status] || maintenance.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/maintenances/edit/${maintenance.id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
