import { Timestamp } from "firebase/firestore";
import moment from "moment";

/**
 * Converts various date formats to WIB (Western Indonesia Time, UTC+7) timezone
 * and formats as DD-MM-YYYY, HH:mm
 * 
 * @param date - The date to format. Can be Date, Firestore Timestamp, or string
 * @returns Formatted date string in DD-MM-YYYY, HH:mm format in WIB timezone
 * 
 * @example
 * // With Date object
 * formatToWIB(new Date('2025-08-01T10:30:00Z'))
 * // Returns: "01-08-2025, 17:30"
 * 
 * @example
 * // With Firestore Timestamp
 * formatToWIB(timestamp)
 * // Returns: "15-12-2025, 14:45"
 * 
 * @example
 * // With null/undefined
 * formatToWIB(null)
 * // Returns: "N/A"
 */
export function formatToWIB(date: Date | Timestamp | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }

  try {
    let dateObj: Date;

    // Handle Firestore Timestamp
    if (date && typeof date === 'object' && 'toDate' in date) {
      dateObj = (date as Timestamp).toDate();
    }
    // Handle Date object
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle string
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Handle other objects that might have toDate method
    else if (date && typeof date === 'object' && typeof (date as any).toDate === 'function') {
      dateObj = (date as any).toDate();
    }
    else {
      console.warn("Unknown date format:", typeof date, date);
      return "N/A";
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date:", date);
      return "N/A";
    }

    // Convert to WIB timezone (UTC+7) and format
    // Since we're using moment without timezone plugin, we'll manually adjust
    const wibOffset = 7 * 60; // 7 hours in minutes
    const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const wibTime = new Date(utcTime + (wibOffset * 60000));

    return moment(wibTime).format('DD-MM-YYYY, HH:mm');

  } catch (error) {
    console.error("Error formatting date:", error, date);
    return "N/A";
  }
}

/**
 * Formats a date to just the date part (DD-MM-YYYY) in WIB timezone
 * 
 * @param date - The date to format
 * @returns Formatted date string in DD-MM-YYYY format
 * 
 * @example
 * formatDateOnlyWIB(new Date('2025-08-01'))
 * // Returns: "01-08-2025"
 */
export function formatDateOnlyWIB(date: Date | Timestamp | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }

  try {
    let dateObj: Date;

    if (date && typeof date === 'object' && 'toDate' in date) {
      dateObj = (date as Timestamp).toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date && typeof date === 'object' && typeof (date as any).toDate === 'function') {
      dateObj = (date as any).toDate();
    } else {
      return "N/A";
    }

    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }

    // Convert to WIB timezone
    const wibOffset = 7 * 60;
    const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const wibTime = new Date(utcTime + (wibOffset * 60000));

    return moment(wibTime).format('DD-MM-YYYY');

  } catch (error) {
    console.error("Error formatting date:", error);
    return "N/A";
  }
}

/**
 * Formats a date to just the time part (HH:mm) in WIB timezone
 * 
 * @param date - The date to format
 * @returns Formatted time string in HH:mm format
 * 
 * @example
 * formatTimeOnlyWIB(new Date('2025-08-01T10:30:00Z'))
 * // Returns: "17:30"
 */
export function formatTimeOnlyWIB(date: Date | Timestamp | string | null | undefined): string {
  if (!date) {
    return "N/A";
  }

  try {
    let dateObj: Date;

    if (date && typeof date === 'object' && 'toDate' in date) {
      dateObj = (date as Timestamp).toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date && typeof date === 'object' && typeof (date as any).toDate === 'function') {
      dateObj = (date as any).toDate();
    } else {
      return "N/A";
    }

    if (isNaN(dateObj.getTime())) {
      return "N/A";
    }

    // Convert to WIB timezone
    const wibOffset = 7 * 60;
    const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
    const wibTime = new Date(utcTime + (wibOffset * 60000));

    return moment(wibTime).format('HH:mm');

  } catch (error) {
    console.error("Error formatting time:", error);
    return "N/A";
  }
}

/**
 * Gets the current date and time in WIB timezone
 * 
 * @returns Current date formatted in DD-MM-YYYY, HH:mm format
 * 
 * @example
 * getCurrentWIBTime()
 * // Returns: "16-08-2025, 14:30"
 */
export function getCurrentWIBTime(): string {
  return formatToWIB(new Date());
}

/**
 * Checks if a date is today in WIB timezone
 * 
 * @param date - The date to check
 * @returns True if the date is today in WIB timezone
 * 
 * @example
 * isToday(new Date())
 * // Returns: true
 */
export function isToday(date: Date | Timestamp | string | null | undefined): boolean {
  if (!date) {
    return false;
  }

  try {
    const today = formatDateOnlyWIB(new Date());
    const checkDate = formatDateOnlyWIB(date);
    return today === checkDate;
  } catch (error) {
    console.error("Error checking if date is today:", error);
    return false;
  }
}

/**
 * Calculates the difference in days between two dates
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between the dates (positive if date1 is after date2)
 * 
 * @example
 * const future = new Date('2025-08-10');
 * const past = new Date('2025-08-01');
 * daysDifference(future, past)
 * // Returns: 9
 */
export function daysDifference(
  date1: Date | Timestamp | string | null | undefined,
  date2: Date | Timestamp | string | null | undefined
): number {
  if (!date1 || !date2) {
    return 0;
  }

  try {
    let dateObj1: Date;
    let dateObj2: Date;

    // Convert date1
    if (date1 && typeof date1 === 'object' && 'toDate' in date1) {
      dateObj1 = (date1 as Timestamp).toDate();
    } else if (date1 instanceof Date) {
      dateObj1 = date1;
    } else if (typeof date1 === 'string') {
      dateObj1 = new Date(date1);
    } else {
      return 0;
    }

    // Convert date2
    if (date2 && typeof date2 === 'object' && 'toDate' in date2) {
      dateObj2 = (date2 as Timestamp).toDate();
    } else if (date2 instanceof Date) {
      dateObj2 = date2;
    } else if (typeof date2 === 'string') {
      dateObj2 = new Date(date2);
    } else {
      return 0;
    }

    const diffTime = dateObj1.getTime() - dateObj2.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;

  } catch (error) {
    console.error("Error calculating days difference:", error);
    return 0;
  }
}