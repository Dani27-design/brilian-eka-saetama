import { Timestamp } from "firebase/firestore";

/**
 * Represents a single maintenance schedule period
 */
export interface MaintenanceSchedule {
  startDate: Date;
  endDate: Date;
  sequenceNumber: number;
}

/**
 * Calculates maintenance schedules based on contract period and maintenance interval
 * 
 * @param contractStartDate - The start date of the contract
 * @param contractEndDate - The end date of the contract
 * @param maintenanceInterval - The interval in days between maintenances
 * @returns Array of maintenance schedules covering the contract period
 * 
 * @example
 * // Contract from Aug 1 to Dec 1 (122 days), interval 30 days
 * const schedules = calculateMaintenanceSchedules(
 *   new Date('2025-08-01'),
 *   new Date('2025-12-01'),
 *   30
 * );
 * // Returns 5 maintenance periods:
 * // 1. Aug 1-30 (30 days)
 * // 2. Aug 31-Sep 29 (30 days)
 * // 3. Sep 30-Oct 29 (30 days)
 * // 4. Oct 30-Nov 28 (30 days)
 * // 5. Nov 29-Dec 1 (3 days)
 */
export function calculateMaintenanceSchedules(
  contractStartDate: Date,
  contractEndDate: Date,
  maintenanceInterval: number
): MaintenanceSchedule[] {
  const schedules: MaintenanceSchedule[] = [];
  
  // Validate inputs
  if (!contractStartDate || !contractEndDate || !maintenanceInterval) {
    console.error("Invalid inputs for maintenance schedule calculation");
    return schedules;
  }

  if (maintenanceInterval <= 0) {
    console.error("Maintenance interval must be greater than 0");
    return schedules;
  }

  if (contractStartDate >= contractEndDate) {
    console.error("Contract start date must be before end date");
    return schedules;
  }

  let currentStartDate = new Date(contractStartDate);
  let sequenceNumber = 1;

  while (currentStartDate < contractEndDate) {
    // Calculate the end date for this maintenance period
    const currentEndDate = new Date(currentStartDate);
    currentEndDate.setDate(currentEndDate.getDate() + maintenanceInterval - 1);

    // If the calculated end date exceeds contract end date, use contract end date
    const actualEndDate = currentEndDate > contractEndDate 
      ? new Date(contractEndDate) 
      : currentEndDate;

    schedules.push({
      startDate: new Date(currentStartDate),
      endDate: actualEndDate,
      sequenceNumber
    });

    // Move to next period (day after current end date)
    currentStartDate = new Date(actualEndDate);
    currentStartDate.setDate(currentStartDate.getDate() + 1);
    sequenceNumber++;
  }

  return schedules;
}

/**
 * Converts a Date object to Firestore Timestamp
 * 
 * @param date - The date to convert
 * @returns Firestore Timestamp
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Formats a maintenance period for display
 * 
 * @param schedule - The maintenance schedule to format
 * @returns Formatted string representation of the period
 * 
 * @example
 * formatMaintenancePeriod(schedule)
 * // Returns: "Period 1: 01/08/2025 - 30/08/2025 (30 days)"
 */
export function formatMaintenancePeriod(schedule: MaintenanceSchedule): string {
  const startStr = schedule.startDate.toLocaleDateString('id-ID');
  const endStr = schedule.endDate.toLocaleDateString('id-ID');
  
  const diffTime = Math.abs(schedule.endDate.getTime() - schedule.startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  
  return `Period ${schedule.sequenceNumber}: ${startStr} - ${endStr} (${diffDays} days)`;
}

/**
 * Validates if a maintenance interval is appropriate for a contract period
 * 
 * @param contractStartDate - The start date of the contract
 * @param contractEndDate - The end date of the contract
 * @param maintenanceInterval - The interval in days between maintenances
 * @returns Object with validation result and message
 */
export function validateMaintenanceInterval(
  contractStartDate: Date,
  contractEndDate: Date,
  maintenanceInterval: number
): { isValid: boolean; message: string; scheduleCount?: number } {
  // Calculate contract duration in days
  const diffTime = Math.abs(contractEndDate.getTime() - contractStartDate.getTime());
  const contractDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (maintenanceInterval <= 0) {
    return {
      isValid: false,
      message: "Maintenance interval must be greater than 0 days"
    };
  }

  if (maintenanceInterval > contractDays) {
    return {
      isValid: false,
      message: `Maintenance interval (${maintenanceInterval} days) exceeds contract duration (${contractDays} days)`
    };
  }

  // Calculate how many maintenances will be created
  const scheduleCount = Math.ceil(contractDays / maintenanceInterval);

  if (scheduleCount > 100) {
    return {
      isValid: false,
      message: `Too many maintenance schedules (${scheduleCount}). Please use a larger interval.`,
      scheduleCount
    };
  }

  return {
    isValid: true,
    message: `Will create ${scheduleCount} maintenance schedule(s)`,
    scheduleCount
  };
}