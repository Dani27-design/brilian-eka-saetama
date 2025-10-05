import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/db/firebase/firebaseConfig";

/**
 * Company contact information structure
 */
export interface CompanyContactInfo {
  phone: string;
  address: string;
  email: string;
  companyName: string;
}

/**
 * Default company information (fallback)
 */
const DEFAULT_COMPANY_INFO: CompanyContactInfo = {
  phone: "+62 812 3456 7890",
  address: "Jakarta, Indonesia",
  email: "info@brilianeka.com",
  companyName: "PT Brilian Eka Saetama",
};

/**
 * Fetches real company contact information from Firestore
 * Uses the contact collection with document ID "find_us"
 * 
 * @returns Promise that resolves to company contact information
 * 
 * @example
 * const companyInfo = await fetchCompanyContactInfo();
 * console.log(companyInfo.phone); // "+62 21 1234 5678"
 */
export async function fetchCompanyContactInfo(): Promise<CompanyContactInfo> {
  try {
    // Fetch contact data from Firestore
    const contactDocRef = doc(firestore, "contact", "find_us");
    const contactSnap = await getDoc(contactDocRef);

    if (!contactSnap.exists()) {
      console.warn("Contact document not found, using default company info");
      return DEFAULT_COMPANY_INFO;
    }

    const contactData = contactSnap.data();

    // Extract English contact information
    const enData = contactData?.en;
    if (!enData) {
      console.warn("English contact data not found, using default company info");
      return DEFAULT_COMPANY_INFO;
    }

    // Build company info from Firestore data
    const companyInfo: CompanyContactInfo = {
      phone: enData.phone?.text || DEFAULT_COMPANY_INFO.phone,
      address: enData.location?.text || DEFAULT_COMPANY_INFO.address,
      email: enData.email?.text || DEFAULT_COMPANY_INFO.email,
      companyName: DEFAULT_COMPANY_INFO.companyName, // Company name is static
    };

    return companyInfo;

  } catch (error) {
    console.error("Error fetching company contact info:", error);
    return DEFAULT_COMPANY_INFO;
  }
}

/**
 * Formats company contact information for certificate display
 * Creates properly formatted strings for PDF generation
 * 
 * @param companyInfo - Company contact information
 * @returns Formatted contact information
 * 
 * @example
 * const formatted = formatCompanyInfoForCertificate(companyInfo);
 * console.log(formatted.fullAddress); // "Jl. Sudirman No. 123, Jakarta 10220, Indonesia"
 */
export function formatCompanyInfoForCertificate(companyInfo: CompanyContactInfo): {
  fullAddress: string;
  contactLine: string;
  emailPhone: string;
} {
  return {
    fullAddress: companyInfo.address,
    contactLine: `Tel: ${companyInfo.phone} | Email: ${companyInfo.email}`,
    emailPhone: `${companyInfo.email} • ${companyInfo.phone}`,
  };
}

/**
 * Validates company contact information
 * Ensures all required fields are present and properly formatted
 * 
 * @param companyInfo - Company contact information to validate
 * @returns Validation result with any missing or invalid fields
 */
export function validateCompanyInfo(companyInfo: CompanyContactInfo): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!companyInfo.companyName || companyInfo.companyName.trim() === "") {
    errors.push("Company name is required");
  }

  if (!companyInfo.phone || companyInfo.phone.trim() === "") {
    errors.push("Phone number is required");
  }

  if (!companyInfo.address || companyInfo.address.trim() === "") {
    errors.push("Address is required");
  }

  if (!companyInfo.email || companyInfo.email.trim() === "") {
    errors.push("Email is required");
  }

  // Basic email validation
  if (companyInfo.email && !companyInfo.email.includes("@")) {
    warnings.push("Email format may be invalid");
  }

  // Phone format validation (basic check)
  if (companyInfo.phone && !companyInfo.phone.includes("+")) {
    warnings.push("Phone number should include country code");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Cached company information to avoid repeated Firestore calls
 * Cache is valid for 1 hour
 */
let cachedCompanyInfo: CompanyContactInfo | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Gets company contact information with caching
 * Reduces Firestore reads by caching data for 1 hour
 * 
 * @param forceRefresh - Optional flag to force refresh from Firestore
 * @returns Promise that resolves to company contact information
 * 
 * @example
 * const companyInfo = await getCachedCompanyInfo();
 * // Subsequent calls within 1 hour will use cached data
 */
export async function getCachedCompanyInfo(forceRefresh: boolean = false): Promise<CompanyContactInfo> {
  const now = Date.now();

  // Check if we have valid cached data
  if (!forceRefresh && cachedCompanyInfo && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedCompanyInfo;
  }

  // Fetch fresh data from Firestore
  const freshData = await fetchCompanyContactInfo();
  
  // Update cache
  cachedCompanyInfo = freshData;
  cacheTimestamp = now;

  return freshData;
}

/**
 * Clears the company information cache
 * Useful when company data is updated and needs to be refreshed
 */
export function clearCompanyInfoCache(): void {
  cachedCompanyInfo = null;
  cacheTimestamp = 0;
}