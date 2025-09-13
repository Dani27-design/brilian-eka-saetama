export interface Province {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  provinceId: string;
  type: "kabupaten" | "kota";
}

export interface District {
  id: string;
  name: string;
  cityId: string;
}

export interface Village {
  id: string;
  name: string;
  districtId: string;
  type: "kelurahan" | "desa";
}

export interface RegionData {
  provinces: Province[];
  cities: City[];
  districts: District[];
  villages: Village[];
}

// API response types
export interface RegionResponse<T> {
  data: T[];
  total: number;
}

// Form selection types
export interface RegionSelections {
  province: string;
  city: string;
  district: string;
  village: string;
}