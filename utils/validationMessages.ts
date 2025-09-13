/**
 * Shared Indonesian validation error messages
 * Used across customer and product import validation systems
 */

// Common field validation messages
export const ValidationMessages = {
  // Required field messages
  REQUIRED_FIELD: (fieldName: string) => `${fieldName} wajib diisi`,
  NAME_REQUIRED: 'Nama wajib diisi',
  PRODUCT_NUMBER_REQUIRED: 'Nomor produk wajib diisi',
  CUSTOMER_NAME_REQUIRED: 'Nama pelanggan wajib diisi',
  PRODUCT_NAME_REQUIRED: 'Nama produk wajib diisi',
  PRODUCT_TYPE_REQUIRED: 'Tipe produk wajib diisi',
  EMAIL_REQUIRED: 'Email wajib diisi',
  PHONE_REQUIRED: 'Nomor telepon wajib diisi',
  CONTACT_NAME_REQUIRED: 'Nama kontak wajib diisi',

  // Format validation messages  
  INVALID_EMAIL_FORMAT: 'Format email tidak valid',
  INVALID_DATE_FORMAT: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD',
  INVALID_NUMBER_FORMAT: (fieldName: string) => `${fieldName} harus berupa angka`,
  INVALID_BOOLEAN_FORMAT: (fieldName: string) => `${fieldName} harus berupa Ya/Tidak`,

  // Duplicate validation messages
  DUPLICATE_PRODUCT_NUMBER: 'Nomor produk duplikat dalam file',
  DUPLICATE_CUSTOMER_NAME: 'Nama pelanggan duplikat dalam file', 
  DUPLICATE_CONTACT_EMAILS: 'Email kontak duplikat ditemukan',

  // Type validation messages
  INVALID_CUSTOMER_TYPE: 'Tipe pelanggan tidak valid. Harus berupa: corporate, individual, government, atau bumn',
  INVALID_PRODUCT_TYPE: (validTypes: string[]) => `Tipe produk tidak valid. Harus berupa: ${validTypes.join(', ')}`,

  // File processing messages
  FILE_EMPTY: 'File kosong',
  MISSING_REQUIRED_HEADERS: (headers: string[]) => `Header wajib yang hilang: ${headers.join(', ')}`,
  FAILED_TO_PARSE_LINE: (error: string) => `Gagal memproses baris: ${error}`,
  FAILED_TO_PROCESS_FILE: (error: string) => `Gagal memproses file: ${error}`,
  FAILED_TO_PARSE_CSV: (error: string) => `Gagal memproses CSV: ${error}`,

  // Contact validation messages
  PRIMARY_CONTACT_NAME_REQUIRED: 'Nama kontak utama wajib diisi ketika info kontak disediakan',
  PRIMARY_CONTACT_EMAIL_REQUIRED: 'Email kontak utama wajib diisi ketika info kontak disediakan', 
  PRIMARY_CONTACT_PHONE_REQUIRED: 'Telepon kontak utama wajib diisi ketika info kontak disediakan',
  AT_LEAST_ONE_CONTACT_REQUIRED: 'Setidaknya satu kontak wajib diisi',
  INVALID_JSON_FORMAT: 'Format JSON tidak valid untuk kontak tambahan',

  // Address validation messages
  ADDRESS_STREET_REQUIRED: 'Alamat jalan wajib diisi',
  ADDRESS_VILLAGE_REQUIRED: 'Desa/Kelurahan wajib diisi',
  ADDRESS_DISTRICT_REQUIRED: 'Kecamatan wajib diisi',
  ADDRESS_CITY_REQUIRED: 'Kota/Kabupaten wajib diisi',
  ADDRESS_PROVINCE_REQUIRED: 'Provinsi wajib diisi',
  INVALID_POSTAL_CODE_FORMAT: 'Kode pos harus berupa 5 digit angka',
  INVALID_PROVINCE: 'Provinsi tidak ditemukan dalam database',
  INVALID_CITY: 'Kota/Kabupaten tidak ditemukan dalam database',
  CITY_NOT_IN_PROVINCE: 'Kota/Kabupaten tidak termasuk dalam provinsi yang dipilih',
  PROVINCE_NO_CITY_DATA: 'Data kota tidak tersedia untuk provinsi ini',
  DISTRICT_NOT_FOUND: 'Kecamatan tidak ditemukan dalam database sample',
  VILLAGE_NOT_FOUND: 'Desa/Kelurahan tidak ditemukan dalam database sample',
  REGION_VALIDATION_WARNING: 'Data wilayah menggunakan validasi terbatas',
  MANUAL_INPUT_ACCEPTED: 'Input manual diterima untuk wilayah ini',

  // Import summary messages
  IMPORT_SUMMARY_HEADER: 'Ringkasan Impor:',
  TOTAL_PROCESSED: (count: number, type: string) => `Total diproses: ${count} ${type}`,
  SUCCESSFULLY_IMPORTED: (count: number, type: string) => `✅ Berhasil diimpor: ${count} ${type}`,
  SKIPPED_DUPLICATES: (count: number, type: string) => `⚠️ Dilewati (duplikat): ${count} ${type}`,
  FAILED_IMPORT: (count: number, type: string) => `❌ Gagal diimpor: ${count} ${type}`,
  IMPORT_SUCCESS_MESSAGE: (count: number, type: string) => `${count} ${type} telah tersimpan dan siap digunakan.`,
  IMPORT_FAILURE_MESSAGE: (count: number, type: string) => `${count} ${type} gagal diimpor karena data tidak valid.`,
  IMPORT_SKIPPED_MESSAGE: (count: number, type: string) => `${count} ${type} dilewati karena sudah ada sebelumnya.`,

  // Recommendation messages (warnings)
  BRAND_RECOMMENDED: 'Brand disarankan diisi',
  FIELD_RECOMMENDED: (fieldName: string) => `${fieldName} disarankan diisi`,
};

// UI Labels for validation sections
export const ValidationLabels = {
  // Section headers
  DATA_QUALITY_CHECK: 'Pemeriksaan Kualitas Data',
  DATA_VALIDATION: 'Validasi Data',
  VALIDATION_RESULTS: 'Hasil Validasi',

  // Status messages
  ALL_VALID: 'Semua Valid',
  ALL_DATA_CORRECT: 'Semua Data Benar', 
  DATA_ISSUES: 'Data Bermasalah',
  VALIDATION_ERRORS: 'Error Validasi',
  CRITICAL_ERRORS: 'Error Kritis',
  WARNINGS: 'Peringatan',
  NEEDS_ATTENTION: 'Perlu perhatian',
  READY_TO_PROCEED: 'Siap dilanjutkan',
  MUST_BE_FIXED: 'Harus Diperbaiki',
  OPTIONAL: 'Opsional',
  DATA_INCOMPLETE: 'Data Tidak Lengkap',
  REGION_DATA_LIMITED: 'Data wilayah terbatas',

  // Count messages
  ERRORS_COUNT: (count: number) => `${count} Error Kritis${count !== 1 ? '' : ''}`,
  WARNINGS_COUNT: (count: number) => `${count} Peringatan${count !== 1 ? '' : ''}`,
  MORE_ERRORS: (count: number) => `... dan ${count} error lainnya`,
  MORE_WARNINGS: (count: number) => `... dan ${count} peringatan lainnya`,

  // Field labels
  ROW: 'Baris',
  FIELD: 'Field', 
  VALUE: 'Nilai',
  ERROR: 'Error',
  MESSAGE: 'Pesan',

  // Action labels
  SHOW_DETAILS: 'Lihat Detail',
  HIDE_DETAILS: 'Sembunyikan Detail',
  FIX_REQUIRED: '(Harus Diperbaiki)',
  OPTIONAL_FIX: '(Opsional)',
};

/**
 * Get field display name in Indonesian
 */
export const getFieldDisplayName = (fieldName: string): string => {
  const fieldNameMap: Record<string, string> = {
    // Product fields
    'productNumber': 'Nomor Produk',
    'name': 'Nama',
    'productType': 'Tipe Produk', 
    'brand': 'Brand',
    'brandType': 'Tipe Brand',
    'source': 'Sumber',
    'maintenanceInterval': 'Interval Maintenance',
    'serialNumber': 'Nomor Seri',
    'manufactureDate': 'Tanggal Produksi',
    'installationDate': 'Tanggal Instalasi',
    'expirationDate': 'Tanggal Kadaluarsa',

    // Customer fields
    'customerType': 'Tipe Pelanggan',
    'businessField': 'Bidang Usaha',
    'email': 'Email',
    'phone': 'Telepon',
    'contactName': 'Nama Kontak',
    'position': 'Posisi',
    'department': 'Departemen',

    // Address fields
    'address': 'Alamat',
    'street': 'Jalan',
    'village': 'Desa/Kelurahan',
    'district': 'Kecamatan',
    'city': 'Kota/Kabupaten',
    'province': 'Provinsi',
    'postalCode': 'Kode Pos',

    // Contact fields
    'primaryContactName': 'Nama Kontak Utama',
    'primaryContactEmail': 'Email Kontak Utama',
    'primaryContactPhone': 'Telepon Kontak Utama',
    'primaryContactPosition': 'Posisi Kontak Utama',
    'primaryContactDepartment': 'Departemen Kontak Utama',
    'additionalContacts': 'Kontak Tambahan',
    'contacts': 'Kontak',

    // Product specification fields
    'height': 'Tinggi',
    'width': 'Lebar', 
    'pressure': 'Tekanan',
    'capacity': 'Kapasitas',
    'agentType': 'Jenis Media',
    'weight': 'Berat',
    'flowRate': 'Debit Air',
    'valveType': 'Tipe Valve',
    'hoseLength': 'Panjang Selang',
    'material': 'Material',
    'resolution': 'Resolusi',
    'lens': 'Lensa',
    'nightVision': 'Night Vision',
    'power': 'Daya',
    'connectivity': 'Konektivitas',
    'pan': 'Pan',
    'tilt': 'Tilt',
    'storageCapacity': 'Kapasitas Storage',
    'sensorType': 'Tipe Sensor',
    'coverageArea': 'Area Cakupan',
    'soundLevel': 'Level Suara',
    'batteryBackup': 'Backup Baterai',
    'lockType': 'Tipe Kunci',
    'openingSpeed': 'Kecepatan Buka',
    'deviceType': 'Tipe Perangkat',
    'batteryLife': 'Daya Tahan Baterai',
    'patrolInterval': 'Interval Patroli',
    'firmwareVersion': 'Versi Firmware',

    // File processing fields
    'file': 'File',
    'headers': 'Header',
    'parsing': 'Parsing',
  };

  return fieldNameMap[fieldName] || fieldName;
};