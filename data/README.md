# Indonesian Regional Data

This directory contains comprehensive Indonesian administrative region data for provinces, cities/regencies, districts, and villages.

## Data Files

### Complete Data
- **`indonesian-provinces.json`** - All 34 Indonesian provinces ✅ Complete
- **`indonesian-cities.json`** - All 514 cities and regencies ✅ Complete

### Sample Data  
- **`indonesian-districts-sample.json`** - Sample of 275 districts from first 20 cities 📊 Sample
- **`indonesian-villages-sample.json`** - Sample of 82 villages from first 5 districts 📊 Sample

### Legacy/Archive Files
- **`indonesian-provinces-complete.json`** - Raw API data (archived)
- **`indonesian-cities-complete.json`** - Raw API data (archived)

## Data Structure

### Province
```json
{
  "id": "32",
  "name": "Jawa Barat"
}
```

### City/Regency
```json
{
  "id": "3273",
  "name": "Bandung",
  "provinceId": "32",
  "type": "kota"
}
```

### District
```json
{
  "id": "3273010",
  "name": "Sukasari",
  "cityId": "3273"
}
```

### Village
```json
{
  "id": "3273010001",
  "name": "Geger Kalong",
  "districtId": "3273010",
  "type": "desa"
}
```

## Data Statistics

- **Provinces**: 34 (Complete - All Indonesian provinces)
- **Cities/Regencies**: 514 (Complete - All kabupaten and kota)
- **Districts**: 275 (Sample - From Aceh province only)
- **Villages**: 82 (Sample - From 5 districts in Aceh)

## Data Source

Data sourced from the official Indonesian administrative regions API:
- **API**: https://emsifa.github.io/api-wilayah-indonesia/
- **Last Updated**: September 2025
- **Coverage**: Complete for provinces and cities, sample for districts and villages

## Usage in Code

```typescript
import { 
  getProvinces, 
  getCitiesByProvince, 
  getDistrictsByCity,
  getVillagesByDistrict 
} from '@/utils/indonesianRegions';

// Get all provinces
const provinces = getProvinces();

// Get cities in West Java
const westJavaCities = getCitiesByProvince('32');

// Get districts in Bandung city (sample data only)
const bandungDistricts = getDistrictsByCity('3273');
```

## Extending the Data

To get complete district and village data for all Indonesia:

1. Run the data fetching script:
```bash
node scripts/fetch-indonesian-data.js
```

2. For production use, consider:
   - Implementing incremental loading
   - Using a dedicated database
   - Caching frequently accessed regions
   - API rate limiting for bulk operations

## File Size Considerations

- Complete districts data: ~7,000+ records
- Complete villages data: ~80,000+ records
- Consider lazy loading or API endpoints for large datasets

## Administrative Levels

1. **Province** (Provinsi) - 34 total
2. **City/Regency** (Kota/Kabupaten) - 514 total
3. **District** (Kecamatan) - ~7,000+ total (sample: 275)
4. **Village** (Kelurahan/Desa) - ~80,000+ total (sample: 82)

## Notes

- City types: `kota` (city) or `kabupaten` (regency)  
- Village types: `kelurahan` (urban village) or `desa` (rural village)
- All IDs follow the official Indonesian administrative coding system
- Names are properly formatted in title case
- Special administrative regions (DKI Jakarta, DI Yogyakarta) included