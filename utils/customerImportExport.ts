import { Customer, ContactPerson, CustomerAddress, CustomerType } from '@/types/customer';
import { parseAddressFromCSV, validateCustomerAddress } from './addressHelper';
import { validateIndonesianAddress } from './indonesianRegions';
import { ValidationResult, ValidationError, ValidationWarning } from '@/types/bulkOperations';
import { ValidationMessages, getFieldDisplayName } from './validationMessages';

// Export utilities
export interface CustomerExportData {
  // Basic Info
  name: string;
  customerType: string;
  businessField: string;

  // Address
  street: string;
  village: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;

  // Primary Contact
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactPosition: string;
  primaryContactDepartment: string;

  // Additional Contacts (JSON string)
  additionalContacts: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  totalContracts: number;
}

/**
 * Convert customers to export format
 */
export function customersToExportData(customers: (Customer & { id: string; contracts?: any[] })[]): CustomerExportData[] {
  return customers.map(customer => {
    // Get primary contact
    const primaryContact = customer.contacts?.find(c => c.id === customer.primaryContactId) 
      || customer.contacts?.[0] 
      || (customer.contact ? {
          name: customer.contact.name,
          email: customer.contact.email,
          phone: customer.contact.phone.toString(),
          position: '',
          department: ''
        } : null);

    // Get additional contacts (excluding primary)
    const additionalContacts = customer.contacts?.filter(c => c.id !== customer.primaryContactId) || [];

    // Format address
    let addressData = {
      street: '',
      village: '',
      district: '',
      city: '',
      province: '',
      postalCode: ''
    };

    if (customer.address) {
      if (typeof customer.address === 'object' && 'street' in customer.address) {
        addressData = {
          street: customer.address.street || '',
          village: customer.address.village || '',
          district: customer.address.district || '',
          city: customer.address.city || '',
          province: customer.address.province || '',
          postalCode: customer.address.postalCode || ''
        };
      } else if (typeof customer.address === 'string') {
        addressData.street = customer.address;
      }
    }

    return {
      // Basic Info
      name: customer.name,
      customerType: customer.customerType || 'corporate',
      businessField: customer.businessField || '',

      // Address
      ...addressData,

      // Primary Contact
      primaryContactName: primaryContact?.name || '',
      primaryContactEmail: primaryContact?.email || '',
      primaryContactPhone: primaryContact?.phone || '',
      primaryContactPosition: primaryContact?.position || '',
      primaryContactDepartment: primaryContact?.department || '',

      // Additional Contacts
      additionalContacts: JSON.stringify(additionalContacts),

      // Metadata
      createdAt: customer.createdAt?.toDate?.()?.toISOString() || '',
      updatedAt: customer.updatedAt?.toDate?.()?.toISOString() || '',
      totalContracts: customer.contracts?.length || 0
    };
  });
}

/**
 * Convert export data to CSV string
 */
export function exportDataToCSV(data: CustomerExportData[]): string {
  if (data.length === 0) return '';

  const headers = [
    'name',
    'customerType',
    'businessField',
    'street',
    'village',
    'district',
    'city',
    'province',
    'postalCode',
    'primaryContactName',
    'primaryContactEmail',
    'primaryContactPhone',
    'primaryContactPosition',
    'primaryContactDepartment',
    'additionalContacts',
    'createdAt',
    'updatedAt',
    'totalContracts'
  ];

  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let value = row[header as keyof CustomerExportData]?.toString() || '';
        // Escape commas and quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

// Import utilities - keeping legacy interface for backward compatibility
export interface ImportValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: ImportValidationError[];
  customers: Omit<Customer, "createdAt" | "updatedAt" | "createdBy" | "updatedBy">[];
}

// New validation result interface aligned with product import
export interface CustomerValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  customers: Omit<Customer, "createdAt" | "updatedAt" | "createdBy" | "updatedBy">[];
  importedCount: number;
}

/**
 * Validate customer data using standardized ValidationResult interface
 * @param customers - Array of customer data to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateCustomerData(customers: Record<string, any>[]): CustomerValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validCustomers: Omit<Customer, "createdAt" | "updatedAt" | "createdBy" | "updatedBy">[] = [];
  const seenNames = new Set<string>();
  
  customers.forEach((customerData, index) => {
    const rowNum = index + 2; // +2 because of header row and 0-index
    
    const addError = (field: string, value: any, message: string) => {
      errors.push({ 
        row: rowNum, 
        field, 
        value: value || '', 
        message 
      });
    };

    const addWarning = (field: string, value: any, message: string) => {
      warnings.push({ 
        row: rowNum, 
        field, 
        value: value || '', 
        message 
      });
    };

    // Validate required fields
    if (!customerData.name?.trim()) {
      addError('name', customerData.name, ValidationMessages.CUSTOMER_NAME_REQUIRED);
      return; // Skip further validation if name is missing
    }

    // Check for duplicates within the file
    if (seenNames.has(customerData.name.trim().toLowerCase())) {
      addError('name', customerData.name, ValidationMessages.DUPLICATE_CUSTOMER_NAME);
    }
    seenNames.add(customerData.name.trim().toLowerCase());

    // Validate customer type
    let customerType: CustomerType = 'corporate';
    if (customerData.customerType) {
      const validTypes = ['corporate', 'individual', 'government', 'bumn'];
      if (validTypes.includes(customerData.customerType.toLowerCase())) {
        customerType = customerData.customerType.toLowerCase() as CustomerType;
      } else {
        addError('customerType', customerData.customerType, ValidationMessages.INVALID_CUSTOMER_TYPE);
      }
    }

    // Parse address
    const address: Partial<CustomerAddress> = parseAddressFromCSV(customerData);
    
    // Validate address if provided
    if (address.province || address.city) {
      const addressValidation = validateCustomerAddress(address as CustomerAddress);
      if (!addressValidation.isValid) {
        Object.entries(addressValidation.errors).forEach(([field, error]) => {
          const fieldValue = address[field as keyof CustomerAddress];
          const stringValue = typeof fieldValue === 'string' ? fieldValue : '';
          // Use getFieldDisplayName for user-friendly field names instead of raw system field names
          const displayField = field === 'region' ? 'address' : `address.${field}`;
          addError(displayField, stringValue, error);
        });
      }
    }

    // Parse primary contact
    const contacts: ContactPerson[] = [];
    let primaryContactId = '';

    if (customerData.primaryContactName || customerData.primaryContactEmail || customerData.primaryContactPhone) {
      if (!customerData.primaryContactName?.trim()) {
        addError('primaryContactName', customerData.primaryContactName, ValidationMessages.PRIMARY_CONTACT_NAME_REQUIRED);
      }
      if (!customerData.primaryContactEmail?.trim()) {
        addError('primaryContactEmail', customerData.primaryContactEmail, ValidationMessages.PRIMARY_CONTACT_EMAIL_REQUIRED);
      }
      if (!customerData.primaryContactPhone?.trim()) {
        addError('primaryContactPhone', customerData.primaryContactPhone, ValidationMessages.PRIMARY_CONTACT_PHONE_REQUIRED);
      }

      // Validate email format
      if (customerData.primaryContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.primaryContactEmail)) {
        addError('primaryContactEmail', customerData.primaryContactEmail, ValidationMessages.INVALID_EMAIL_FORMAT);
      }

      if (customerData.primaryContactName && customerData.primaryContactEmail && customerData.primaryContactPhone) {
        primaryContactId = 'primary_' + Date.now();
        contacts.push({
          id: primaryContactId,
          name: customerData.primaryContactName.trim(),
          email: customerData.primaryContactEmail.trim(),
          phone: customerData.primaryContactPhone.trim(),
          position: customerData.primaryContactPosition?.trim() || '',
          department: customerData.primaryContactDepartment?.trim() || '',
          isPrimary: true,
          isActive: true
        });
      }
    }

    // Parse additional contacts
    if (customerData.additionalContacts) {
      try {
        const additionalContactsData = JSON.parse(customerData.additionalContacts);
        if (Array.isArray(additionalContactsData)) {
          additionalContactsData.forEach((contactData, contactIndex) => {
            if (contactData.name && contactData.email && contactData.phone) {
              // Validate email format
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
                addError(`additionalContacts[${contactIndex}].email`, contactData.email, ValidationMessages.INVALID_EMAIL_FORMAT);
                return;
              }

              contacts.push({
                id: `additional_${Date.now()}_${contactIndex}`,
                name: contactData.name.trim(),
                email: contactData.email.trim(),
                phone: contactData.phone.trim(),
                position: contactData.position?.trim() || '',
                department: contactData.department?.trim() || '',
                isPrimary: false,
                isActive: true
              });
            }
          });
        }
      } catch (error) {
        addError('additionalContacts', customerData.additionalContacts, ValidationMessages.INVALID_JSON_FORMAT);
      }
    }

    // Ensure at least one contact
    if (contacts.length === 0) {
      addError('contacts', '', ValidationMessages.AT_LEAST_ONE_CONTACT_REQUIRED);
      return;
    }

    // Check for duplicate emails within contacts
    const emails = contacts.map(c => c.email.toLowerCase());
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    if (duplicateEmails.length > 0) {
      addError('contacts', duplicateEmails.join(', '), ValidationMessages.DUPLICATE_CONTACT_EMAILS);
    }

    // Add warnings for recommended fields
    if (!customerData.businessField?.trim()) {
      addWarning('businessField', customerData.businessField, ValidationMessages.FIELD_RECOMMENDED('Bidang Usaha'));
    }

    // If no errors for this customer, add to valid customers
    const customerErrors = errors.filter(e => e.row === rowNum);
    if (customerErrors.length === 0) {
      validCustomers.push({
        name: customerData.name.trim(),
        customerType,
        businessField: customerData.businessField?.trim(),
        address: address as CustomerAddress,
        contacts,
        primaryContactId
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    customers: validCustomers,
    importedCount: validCustomers.length
  };
}

/**
 * Parse CSV content to customer data (legacy function - kept for backward compatibility)
 */
export function parseCSVToCustomers(csvContent: string): ImportResult {
  const result: ImportResult = {
    success: false,
    importedCount: 0,
    errors: [],
    customers: []
  };

  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      result.errors.push({
        row: 0,
        field: 'file',
        value: '',
        error: ValidationMessages.FILE_EMPTY
      });
      return result;
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);

    // Validate required headers
    const requiredHeaders = ['name'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      result.errors.push({
        row: 0,
        field: 'headers',
        value: missingHeaders.join(', '),
        error: ValidationMessages.MISSING_REQUIRED_HEADERS(missingHeaders)
      });
      return result;
    }

    // Process each data line
    dataLines.forEach((line, index) => {
      const rowNum = index + 2; // +2 because index starts at 0 and we skip header
      
      try {
        const values = parseCSVLine(line);
        if (values.length === 0) return; // Skip empty lines

        const rowData: Record<string, string> = {};
        headers.forEach((header, i) => {
          rowData[header] = values[i] || '';
        });

        const customerData = parseRowToCustomer(rowData, rowNum, result.errors);
        if (customerData) {
          result.customers.push(customerData);
        }

      } catch (error) {
        result.errors.push({
          row: rowNum,
          field: 'parsing',
          value: line,
          error: ValidationMessages.FAILED_TO_PARSE_LINE(String(error))
        });
      }
    });

    result.importedCount = result.customers.length;
    result.success = result.customers.length > 0;

  } catch (error) {
    result.errors.push({
      row: 0,
      field: 'file',
      value: '',
      error: ValidationMessages.FAILED_TO_PROCESS_FILE(String(error))
    });
  }

  return result;
}

/**
 * Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Double quote escape
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current); // Add last field
  return result;
}

/**
 * Convert row data to customer object
 */
function parseRowToCustomer(
  rowData: Record<string, string>, 
  rowNum: number, 
  errors: ImportValidationError[]
): Omit<Customer, "createdAt" | "updatedAt" | "createdBy" | "updatedBy"> | null {
  const addError = (field: string, value: string, error: string) => {
    errors.push({ row: rowNum, field, value, error });
  };

  // Validate required fields
  if (!rowData.name?.trim()) {
    addError('name', rowData.name || '', ValidationMessages.CUSTOMER_NAME_REQUIRED);
    return null;
  }

  // Parse customer type
  let customerType: CustomerType = 'corporate';
  if (rowData.customerType) {
    const validTypes = ['corporate', 'individual', 'government', 'bumn'];
    if (validTypes.includes(rowData.customerType.toLowerCase())) {
      customerType = rowData.customerType.toLowerCase() as CustomerType;
    } else {
      addError('customerType', rowData.customerType, ValidationMessages.INVALID_CUSTOMER_TYPE);
    }
  }

  // Parse address
  const address: Partial<CustomerAddress> = parseAddressFromCSV(rowData);
  
  // Validate address if provided
  if (address.province || address.city) {
    const addressValidation = validateCustomerAddress(address as CustomerAddress);
    if (!addressValidation.isValid) {
      Object.entries(addressValidation.errors).forEach(([field, error]) => {
        const fieldValue = address[field as keyof CustomerAddress];
        const stringValue = typeof fieldValue === 'string' ? fieldValue : '';
        // Use getFieldDisplayName for user-friendly field names instead of raw system field names
        const displayField = field === 'region' ? 'address' : `address.${field}`;
        addError(displayField, stringValue, error);
      });
    }
  }

  // Parse primary contact
  const contacts: ContactPerson[] = [];
  let primaryContactId = '';

  if (rowData.primaryContactName || rowData.primaryContactEmail || rowData.primaryContactPhone) {
    if (!rowData.primaryContactName?.trim()) {
      addError('primaryContactName', rowData.primaryContactName || '', ValidationMessages.PRIMARY_CONTACT_NAME_REQUIRED);
    }
    if (!rowData.primaryContactEmail?.trim()) {
      addError('primaryContactEmail', rowData.primaryContactEmail || '', ValidationMessages.PRIMARY_CONTACT_EMAIL_REQUIRED);
    }
    if (!rowData.primaryContactPhone?.trim()) {
      addError('primaryContactPhone', rowData.primaryContactPhone || '', ValidationMessages.PRIMARY_CONTACT_PHONE_REQUIRED);
    }

    // Validate email format
    if (rowData.primaryContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowData.primaryContactEmail)) {
      addError('primaryContactEmail', rowData.primaryContactEmail, ValidationMessages.INVALID_EMAIL_FORMAT);
    }

    if (rowData.primaryContactName && rowData.primaryContactEmail && rowData.primaryContactPhone) {
      primaryContactId = 'primary_' + Date.now();
      contacts.push({
        id: primaryContactId,
        name: rowData.primaryContactName.trim(),
        email: rowData.primaryContactEmail.trim(),
        phone: rowData.primaryContactPhone.trim(),
        position: rowData.primaryContactPosition?.trim() || '',
        department: rowData.primaryContactDepartment?.trim() || '',
        isPrimary: true,
        isActive: true
      });
    }
  }

  // Parse additional contacts
  if (rowData.additionalContacts) {
    try {
      const additionalContactsData = JSON.parse(rowData.additionalContacts);
      if (Array.isArray(additionalContactsData)) {
        additionalContactsData.forEach((contactData, index) => {
          if (contactData.name && contactData.email && contactData.phone) {
            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactData.email)) {
              addError(`additionalContacts[${index}].email`, contactData.email, ValidationMessages.INVALID_EMAIL_FORMAT);
              return;
            }

            contacts.push({
              id: `additional_${Date.now()}_${index}`,
              name: contactData.name.trim(),
              email: contactData.email.trim(),
              phone: contactData.phone.trim(),
              position: contactData.position?.trim() || '',
              department: contactData.department?.trim() || '',
              isPrimary: false,
              isActive: true
            });
          }
        });
      }
    } catch (error) {
      addError('additionalContacts', rowData.additionalContacts, ValidationMessages.INVALID_JSON_FORMAT);
    }
  }

  // Ensure at least one contact
  if (contacts.length === 0) {
    addError('contacts', '', ValidationMessages.AT_LEAST_ONE_CONTACT_REQUIRED);
    return null;
  }

  // Check for duplicate emails within contacts
  const emails = contacts.map(c => c.email.toLowerCase());
  const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
  if (duplicateEmails.length > 0) {
    addError('contacts', duplicateEmails.join(', '), ValidationMessages.DUPLICATE_CONTACT_EMAILS);
  }

  return {
    name: rowData.name.trim(),
    customerType,
    businessField: rowData.businessField?.trim(),
    address: address as CustomerAddress,
    contacts,
    primaryContactId
  };
}

/**
 * Get CSV template for customer import with Indonesian headers
 */
export function getCustomerCSVTemplate(): string {
  const headers = [
    'Nama Pelanggan',
    'Tipe Pelanggan',
    'Bidang Usaha',
    'Alamat Jalan',
    'Desa Kelurahan',
    'Kecamatan',
    'Kota Kabupaten',
    'Provinsi',
    'Kode Pos',
    'Nama Kontak Utama',
    'Email Kontak Utama',
    'Telepon Kontak Utama',
    'Posisi Kontak Utama'
    // Removed 'Departemen Kontak Utama' as no equivalent field exists in dropdown
  ];

  const exampleRow = [
    'PT Maju Bersama Teknologi',
    'corporate',
    'Teknologi Informasi',
    'Jl Sudirman No 123 RT 001 RW 002',
    'Kebayoran Baru',
    'Kebayoran Baru',
    'Jakarta Selatan',
    'DKI Jakarta',
    '12190',
    'Budi Santoso',
    'budi.santoso@majubersama.com',
    '081234567890',
    'Manager IT'
    // Removed department data to match header count
  ];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}

/**
 * Export customers to downloadable file
 */
export function downloadCustomersAsCSV(customers: (Customer & { id: string; contracts?: any[] })[], filename = 'customers.csv') {
  const exportData = customersToExportData(customers);
  const csvContent = exportDataToCSV(exportData);
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Download CSV template
 */
export function downloadCustomerCSVTemplate(filename = 'customer_template.csv') {
  const csvContent = getCustomerCSVTemplate();
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}