"use client";

import { useState, useMemo } from "react";
import { MaintenanceTableRow } from "@/utils/maintenanceDataLoader";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface CalendarViewProps {
  maintenances: MaintenanceTableRow[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", 
  waiting_approval: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

export function CalendarView({ maintenances, selectedDate, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

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

  // Group maintenances by date
  const maintenancesByDate = useMemo(() => {
    const grouped: Record<string, MaintenanceTableRow[]> = {};
    
    maintenances.forEach(maintenance => {
      if (maintenance.startDate) {
        const dateKey = format(maintenance.startDate, "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(maintenance);
      }
    });
    
    return grouped;
  }, [maintenances]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev => direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  return (
    <div className="p-6">
      {/* Calendar Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
          </h2>
          
          <div className="flex gap-1">
            <button
              onClick={() => navigateMonth("prev")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => navigateMonth("next")}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <button
          onClick={goToToday}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-opacity-90"
        >
          Hari Ini
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(day => (
          <div
            key={day}
            className="flex h-10 items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400"
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
          
          return (
            <div
              key={day.toString()}
              className={`min-h-24 cursor-pointer border border-stroke p-1 hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-800 ${
                isSelected ? "bg-primary/10 dark:bg-primary/20" : ""
              } ${!isCurrentMonth ? "bg-gray-50 dark:bg-gray-900/50" : ""}`}
              onClick={() => onDateSelect(day)}
            >
              <div className="flex flex-col">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded text-sm ${
                    isToday
                      ? "bg-primary text-white"
                      : isCurrentMonth
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400"
                  }`}
                >
                  {format(day, "d")}
                </div>
                
                {/* Maintenance indicators */}
                <div className="mt-1 space-y-1">
                  {dayMaintenances.slice(0, 2).map((maintenance, index) => (
                    <div
                      key={maintenance.id}
                      className={`rounded px-1 py-0.5 text-xs truncate ${
                        statusColors[maintenance.status as keyof typeof statusColors]
                      }`}
                      title={`${maintenance.contractNumber} - ${maintenance.status}`}
                    >
                      {maintenance.contractNumber}
                    </div>
                  ))}
                  
                  {dayMaintenances.length > 2 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayMaintenances.length - 2} lainnya
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Date Details */}
      {maintenancesByDate[format(selectedDate, "yyyy-MM-dd")]?.length > 0 && (
        <div className="mt-6 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-gray-900/20">
          <h3 className="mb-3 font-medium text-gray-900 dark:text-white">
            Maintenance pada {format(selectedDate, "dd MMMM yyyy", { locale: idLocale })}
          </h3>
          
          <div className="space-y-2">
            {maintenancesByDate[format(selectedDate, "yyyy-MM-dd")].map(maintenance => (
              <div
                key={maintenance.id}
                className="flex items-center justify-between rounded-lg border border-stroke bg-white p-3 dark:border-strokedark dark:bg-boxdark"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {maintenance.contractNumber}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {maintenance.productName}
                  </div>
                </div>
                
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  statusColors[maintenance.status as keyof typeof statusColors]
                }`}>
                  {maintenance.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}