"use client";

import { useState, useEffect } from "react";
import { CustomerAddress } from "@/types/customer";
import { Province, City } from "@/types/indonesianRegions";
import { getProvinces, getCitiesByProvince, getProvinceById, getCityById, provinceHasCityData, getProvincesWithCityData, getProvinceByName, getCityByName, cityHasDistrictData, districtHasVillageData, getDistrictByName } from "@/utils/indonesianRegions";
import { validateCustomerAddress } from "@/utils/addressHelper";
import AddressAutocomplete from "./AddressAutocomplete";

interface AddressFormProps {
  address: Partial<CustomerAddress>;
  onChange: (address: Partial<CustomerAddress>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export default function AddressForm({
  address,
  onChange,
  errors = {},
  disabled = false
}: AddressFormProps) {
  const [provinces] = useState<Province[]>(getProvinces());
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [hasRunConversion, setHasRunConversion] = useState(false);
  const [provincesWithCityData] = useState<Set<string>>(getProvincesWithCityData());
  const [cityDataAvailable, setCityDataAvailable] = useState(false);
  const [showCityTextInput, setShowCityTextInput] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");

  // Convert stored IDs to names for form display (edit mode only)
  useEffect(() => {
    // Only run conversion once when address has data and we haven't run conversion yet
    if (!hasRunConversion && address && Object.keys(address).length > 0) {
      let needsConversion = false;
      const convertedAddress = { ...address };
      
      // Convert province ID to name if it's an ID (numeric string)
      if (address.province && !isNaN(Number(address.province))) {
        const province = getProvinceById(address.province);
        if (province) {
          convertedAddress.province = province.name;
          needsConversion = true;
        } else {
          console.warn(`Province ID not found in data: ${address.province}`);
        }
      }
      
      // Convert city ID to name if it's an ID (numeric string)  
      if (address.city && !isNaN(Number(address.city))) {
        const city = getCityById(address.city);
        if (city) {
          convertedAddress.city = city.name;
          needsConversion = true;
        } else {
          console.warn(`City ID not found in data: ${address.city}`);
          // Keep the original ID if we can't convert it
          convertedAddress.city = address.city;
        }
      }
      
      // Mark conversion as run and update address if conversion happened
      setHasRunConversion(true);
      if (needsConversion) {
        onChange(convertedAddress);
      }
    }
  }, [address, onChange, hasRunConversion]);

  // Load cities when province changes
  useEffect(() => {
    if (address.province) {
      setLoadingCities(true);
      
      // Get province ID for cities lookup - improve ID resolution
      let provinceId = address.province;
      let provinceObj: Province | undefined = undefined;
      
      if (isNaN(Number(address.province))) {
        // If province is a name, find the ID
        provinceObj = getProvinceByName(address.province);
        if (provinceObj) {
          provinceId = provinceObj.id;
        } else {
          // Try fuzzy matching with provinces array
          provinceObj = provinces.find(p => 
            address.province && (
              p.name.toLowerCase().includes(address.province.toLowerCase()) ||
              address.province.toLowerCase().includes(p.name.toLowerCase())
            )
          );
          if (provinceObj) {
            provinceId = provinceObj.id;
            console.info(`Found province by fuzzy match: ${provinceObj.name}`);
          } else {
            console.warn(`Province not found: ${address.province}`);
            setLoadingCities(false);
            setCityDataAvailable(false);
            setShowCityTextInput(true);
            return;
          }
        }
      } else {
        // It's an ID, get the province object
        provinceObj = getProvinceById(provinceId);
      }
      
      // Check if this province has city data
      const hasCityData = provinceHasCityData(provinceId);
      setCityDataAvailable(hasCityData);
      setShowCityTextInput(!hasCityData);
      
      // Async operation to properly handle loading state
      const loadCities = async () => {
        try {
          const citiesForProvince = getCitiesByProvince(provinceId);
          
          if (citiesForProvince.length === 0) {
            console.info(`No city data available for province ${provinceObj?.name || provinceId}. Using text input mode.`);
          } else {
            console.info(`Loaded ${citiesForProvince.length} cities for province ${provinceObj?.name || provinceId}`);
          }
          
          setCities(citiesForProvince);
          
          // Only clear city if we have dropdown data and current city doesn't belong to province
          if (hasCityData && address.city && citiesForProvince.length > 0) {
            const cityExists = citiesForProvince.find(c => 
              address.city && (
                c.name.toLowerCase() === address.city.toLowerCase() ||
                c.id === address.city
              )
            );
            
            if (cityExists) {
              setSelectedCityId(cityExists.id);
            } else {
              console.info(`City "${address.city}" not found in ${provinceObj?.name || provinceId}, clearing dependent fields`);
              const newAddress = { ...address, city: "", district: "", village: "" };
              setSelectedCityId("");
              setTimeout(() => onChange(newAddress), 0);
            }
          }
        } catch (error) {
          console.error('Error loading cities:', error);
          setCities([]);
          setCityDataAvailable(false);
          setShowCityTextInput(true);
        } finally {
          setLoadingCities(false);
        }
      };
      
      loadCities();
    } else {
      setCities([]);
      setLoadingCities(false);
      setCityDataAvailable(false);
      setShowCityTextInput(false);
      
      // Clear dependent fields when no province is selected
      if (address.city || address.district || address.village) {
        const newAddress = { 
          ...address, 
          city: "", 
          district: "", 
          village: "" 
        };
        setSelectedCityId("");
        setSelectedDistrictId("");
        setTimeout(() => onChange(newAddress), 0);
      }
    }
  }, [address.province, provinces]);

  const handleFieldChange = (field: keyof CustomerAddress, value: string) => {
    const newAddress = { ...address, [field]: value };
    
    // Clear dependent fields when parent changes
    if (field === "province") {
      newAddress.city = "";
      newAddress.district = "";
      newAddress.village = "";
      setSelectedCityId("");
      setSelectedDistrictId("");
    } else if (field === "city") {
      newAddress.district = "";
      newAddress.village = "";
      setSelectedDistrictId("");
      
      // Update selected city ID when city changes
      if (value && cities.length > 0) {
        const selectedCity = cities.find(c => c.name === value);
        if (selectedCity) {
          setSelectedCityId(selectedCity.id);
        }
      }
    } else if (field === "district") {
      newAddress.village = "";
      
      // Update selected district ID when district changes (if we have district data)
      if (value && selectedCityId) {
        const district = getDistrictByName(value, selectedCityId);
        if (district) {
          setSelectedDistrictId(district.id);
        } else {
          setSelectedDistrictId("");
        }
      } else {
        setSelectedDistrictId("");
      }
    }
    
    onChange(newAddress);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">
        Alamat
      </h3>
      
      {/* Street Address */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Alamat Jalan <span className="text-red-500">*</span>
        </label>
        <textarea
          value={address.street || ""}
          onChange={(e) => handleFieldChange("street", e.target.value)}
          disabled={disabled}
          rows={2}
          className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
            errors.street
              ? "border-red-500 bg-red-50"
              : "border-stroke bg-transparent"
          }`}
          placeholder="Contoh: Jl. Sudirman No. 123, RT 001/RW 002"
        />
        {errors.street && (
          <p className="mt-1 text-sm text-red-600">{errors.street}</p>
        )}
      </div>

      {/* Province */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Provinsi <span className="text-red-500">*</span>
        </label>
        <select
          value={address.province || ""}
          onChange={(e) => handleFieldChange("province", e.target.value)}
          disabled={disabled}
          className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
            errors.province
              ? "border-red-500 bg-red-50"
              : "border-stroke bg-transparent"
          }`}
        >
          <option value="">Pilih Provinsi</option>
          {provinces.map((province) => (
            <option key={province.id} value={province.name}>
              {province.name} {provincesWithCityData.has(province.id) ? "" : "(⚠️ Data kota terbatas)"}
            </option>
          ))}
        </select>
        {errors.province && (
          <p className="mt-1 text-sm text-red-600">{errors.province}</p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Kota/Kabupaten <span className="text-red-500">*</span>
        </label>
        {showCityTextInput ? (
          <>
            <input
              type="text"
              value={address.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              disabled={disabled || !address.province}
              className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
                errors.city
                  ? "border-red-500 bg-red-50"
                  : "border-stroke bg-transparent"
              }`}
              placeholder={!address.province ? "Pilih provinsi terlebih dahulu" : "Masukkan nama kota/kabupaten"}
            />
            {address.province && showCityTextInput && (
              <p className="mt-1 text-xs text-amber-600">
                ℹ️ Data kota untuk provinsi ini menggunakan input manual
              </p>
            )}
          </>
        ) : (
          <select
            value={address.city || ""}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            disabled={disabled || !address.province || loadingCities}
            className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
              errors.city
                ? "border-red-500 bg-red-50"
                : "border-stroke bg-transparent"
            }`}
          >
            <option value="">
              {loadingCities 
                ? "Memuat..." 
                : !address.province 
                ? "Pilih provinsi terlebih dahulu"
                : cities.length === 0
                ? "Data kota tidak tersedia"
                : "Pilih Kota/Kabupaten"
              }
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.name}>
                {city.type === "kota" ? "Kota " : "Kab. "}{city.name}
              </option>
            ))}
          </select>
        )}
        {errors.city && (
          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
        )}
      </div>

      {/* District */}
      <div>
        {selectedCityId && cityHasDistrictData(selectedCityId) ? (
          <AddressAutocomplete
            type="district"
            value={address.district || ""}
            onChange={(value) => handleFieldChange("district", value)}
            placeholder="Ketik nama kecamatan..."
            disabled={disabled || !selectedCityId}
            parentId={selectedCityId}
            error={errors.district}
            label="Kecamatan"
            required
          />
        ) : (
          <>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kecamatan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address.district || ""}
              onChange={(e) => handleFieldChange("district", e.target.value)}
              disabled={disabled || !address.city}
              className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
                errors.district
                  ? "border-red-500 bg-red-50"
                  : "border-stroke bg-transparent"
              }`}
              placeholder={!address.city ? "Pilih kota terlebih dahulu" : "Nama Kecamatan"}
            />
            {!selectedCityId && address.city && (
              <p className="mt-1 text-xs text-amber-600">
                ℹ️ Data kecamatan untuk kota ini menggunakan input manual
              </p>
            )}
            {errors.district && (
              <p className="mt-1 text-sm text-red-600">{errors.district}</p>
            )}
          </>
        )}
      </div>

      {/* Village */}
      <div>
        {selectedDistrictId && districtHasVillageData(selectedDistrictId) ? (
          <AddressAutocomplete
            type="village"
            value={address.village || ""}
            onChange={(value) => handleFieldChange("village", value)}
            placeholder="Ketik nama kelurahan/desa..."
            disabled={disabled || !selectedDistrictId}
            parentId={selectedDistrictId}
            error={errors.village}
            label="Kelurahan/Desa"
            required
          />
        ) : (
          <>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Kelurahan/Desa <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={address.village || ""}
              onChange={(e) => handleFieldChange("village", e.target.value)}
              disabled={disabled || !address.district}
              className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
                errors.village
                  ? "border-red-500 bg-red-50"
                  : "border-stroke bg-transparent"
              }`}
              placeholder={!address.district ? "Pilih kecamatan terlebih dahulu" : "Nama Kelurahan/Desa"}
            />
            {!selectedDistrictId && address.district && (
              <p className="mt-1 text-xs text-amber-600">
                ℹ️ Data kelurahan/desa untuk kecamatan ini menggunakan input manual
              </p>
            )}
            {errors.village && (
              <p className="mt-1 text-sm text-red-600">{errors.village}</p>
            )}
          </>
        )}
      </div>

      {/* Postal Code */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Kode Pos
        </label>
        <input
          type="text"
          value={address.postalCode || ""}
          onChange={(e) => handleFieldChange("postalCode", e.target.value)}
          disabled={disabled}
          maxLength={5}
          className={`w-full rounded-lg border px-4 py-2 outline-none focus:border-primary ${
            errors.postalCode
              ? "border-red-500 bg-red-50"
              : "border-stroke bg-transparent"
          }`}
          placeholder="12345"
        />
        {errors.postalCode && (
          <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
        )}
      </div>

      {/* Region validation error */}
      {errors.region && (
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-600">{errors.region}</p>
        </div>
      )}
    </div>
  );
}