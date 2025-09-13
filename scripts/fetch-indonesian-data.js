const fs = require('fs');
const https = require('https');

const BASE_URL = 'http://www.emsifa.com/api-wilayah-indonesia/api';

// Helper function to fetch JSON data
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url.replace('http:', 'https:'), (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllRegencies() {
  console.log('Fetching all regencies...');
  const allRegencies = [];
  
  const provinces = [11,12,13,14,15,16,17,18,19,21,31,32,33,34,35,36,51,52,53,61,62,63,64,65,71,72,73,74,75,76,81,82,91,94];
  
  for (const provinceId of provinces) {
    try {
      console.log(`Fetching regencies for province ${provinceId}...`);
      const regencies = await fetchJSON(`${BASE_URL}/regencies/${provinceId}.json`);
      allRegencies.push(...regencies);
      await delay(100); // Rate limiting
    } catch (error) {
      console.error(`Error fetching regencies for province ${provinceId}:`, error.message);
    }
  }
  
  return allRegencies;
}

async function fetchAllDistricts() {
  console.log('Fetching all districts...');
  const allDistricts = [];
  
  // First get all regencies
  const regencies = await fetchAllRegencies();
  console.log(`Found ${regencies.length} regencies`);
  
  for (const regency of regencies) {
    try {
      console.log(`Fetching districts for regency ${regency.name} (${regency.id})...`);
      const districts = await fetchJSON(`${BASE_URL}/districts/${regency.id}.json`);
      allDistricts.push(...districts);
      await delay(100); // Rate limiting
    } catch (error) {
      console.error(`Error fetching districts for regency ${regency.id}:`, error.message);
    }
  }
  
  return allDistricts;
}

async function fetchSampleVillages() {
  console.log('Fetching sample villages from first 10 districts...');
  const sampleVillages = [];
  
  // Get first 10 districts as sample
  const districts = await fetchAllDistricts();
  const sampleDistricts = districts.slice(0, 10);
  
  for (const district of sampleDistricts) {
    try {
      console.log(`Fetching villages for district ${district.name} (${district.id})...`);
      const villages = await fetchJSON(`${BASE_URL}/villages/${district.id}.json`);
      sampleVillages.push(...villages);
      await delay(100); // Rate limiting
    } catch (error) {
      console.error(`Error fetching villages for district ${district.id}:`, error.message);
    }
  }
  
  return sampleVillages;
}

async function main() {
  try {
    console.log('Starting Indonesian regional data fetch...');
    
    // 1. Fetch updated provinces
    console.log('1. Fetching provinces...');
    const provinces = await fetchJSON(`${BASE_URL}/provinces.json`);
    fs.writeFileSync('./data/indonesian-provinces-complete.json', JSON.stringify(provinces, null, 2));
    console.log(`✓ Saved ${provinces.length} provinces`);
    
    // 2. Fetch all regencies/cities
    console.log('2. Fetching all regencies...');
    const regencies = await fetchAllRegencies();
    
    // Transform to match existing format
    const cities = regencies.map(regency => ({
      id: regency.id,
      name: regency.name,
      provinceId: regency.province_id,
      type: regency.id.endsWith('71') || regency.id.endsWith('72') || regency.id.endsWith('73') || 
            regency.id.endsWith('74') || regency.id.endsWith('75') || regency.id.endsWith('76') || 
            regency.id.endsWith('77') || regency.id.endsWith('78') || regency.id.endsWith('79') ? 'kota' : 'kabupaten'
    }));
    
    fs.writeFileSync('./data/indonesian-cities-complete.json', JSON.stringify(cities, null, 2));
    console.log(`✓ Saved ${cities.length} cities/regencies`);
    
    // 3. Fetch all districts
    console.log('3. Fetching all districts...');
    const districts = await fetchAllDistricts();
    
    // Transform to match our format
    const districtData = districts.map(district => ({
      id: district.id,
      name: district.name,
      cityId: district.regency_id
    }));
    
    fs.writeFileSync('./data/indonesian-districts.json', JSON.stringify(districtData, null, 2));
    console.log(`✓ Saved ${districtData.length} districts`);
    
    // 4. Fetch sample villages (first 10 districts only due to size)
    console.log('4. Fetching sample villages...');
    const villages = await fetchSampleVillages();
    
    // Transform to match our format
    const villageData = villages.map(village => ({
      id: village.id,
      name: village.name,
      districtId: village.district_id,
      type: 'desa' // Default type, API doesn't distinguish
    }));
    
    fs.writeFileSync('./data/indonesian-villages-sample.json', JSON.stringify(villageData, null, 2));
    console.log(`✓ Saved ${villageData.length} sample villages`);
    
    console.log('\nFetch complete! Files saved:');
    console.log('- data/indonesian-provinces-complete.json');
    console.log('- data/indonesian-cities-complete.json');
    console.log('- data/indonesian-districts.json');
    console.log('- data/indonesian-villages-sample.json');
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchJSON,
  fetchAllRegencies,
  fetchAllDistricts,
  fetchSampleVillages
};