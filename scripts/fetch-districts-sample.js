const fs = require('fs');
const https = require('https');

const BASE_URL = 'http://www.emsifa.com/api-wilayah-indonesia/api';

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

async function fetchSampleDistricts() {
  console.log('Fetching sample districts from first 20 cities...');
  const allDistricts = [];
  
  // Get cities from data file
  const cities = JSON.parse(fs.readFileSync('./data/indonesian-cities.json', 'utf8'));
  
  // Take first 20 cities as sample to avoid timeout
  const sampleCities = cities.slice(0, 20);
  
  for (const city of sampleCities) {
    try {
      console.log(`Fetching districts for ${city.name} (${city.id})...`);
      const districts = await fetchJSON(`${BASE_URL}/districts/${city.id}.json`);
      
      // Transform to match our format
      const districtData = districts.map(district => ({
        id: district.id,
        name: district.name,
        cityId: district.regency_id
      }));
      
      allDistricts.push(...districtData);
      await delay(200); // Rate limiting
    } catch (error) {
      console.error(`Error fetching districts for city ${city.id}:`, error.message);
    }
  }
  
  return allDistricts;
}

async function fetchSampleVillages() {
  console.log('Fetching sample villages from first 5 districts...');
  const sampleVillages = [];
  
  // Get districts data from the sample we just fetched
  if (!fs.existsSync('./data/indonesian-districts-sample.json')) {
    console.log('No districts sample found, skipping villages fetch.');
    return [];
  }
  
  const districts = JSON.parse(fs.readFileSync('./data/indonesian-districts-sample.json', 'utf8'));
  const sampleDistricts = districts.slice(0, 5);
  
  for (const district of sampleDistricts) {
    try {
      console.log(`Fetching villages for district ${district.name} (${district.id})...`);
      const villages = await fetchJSON(`${BASE_URL}/villages/${district.id}.json`);
      
      // Transform to match our format
      const villageData = villages.map(village => ({
        id: village.id,
        name: village.name,
        districtId: village.district_id,
        type: 'desa' // Default type, API doesn't distinguish kelurahan vs desa
      }));
      
      sampleVillages.push(...villageData);
      await delay(200); // Rate limiting
    } catch (error) {
      console.error(`Error fetching villages for district ${district.id}:`, error.message);
    }
  }
  
  return sampleVillages;
}

async function main() {
  try {
    console.log('Starting sample Indonesian districts and villages fetch...');
    
    // 1. Fetch sample districts
    const districts = await fetchSampleDistricts();
    fs.writeFileSync('./data/indonesian-districts-sample.json', JSON.stringify(districts, null, 2));
    console.log(`✓ Saved ${districts.length} sample districts`);
    
    // 2. Fetch sample villages
    const villages = await fetchSampleVillages();
    if (villages.length > 0) {
      fs.writeFileSync('./data/indonesian-villages-sample.json', JSON.stringify(villages, null, 2));
      console.log(`✓ Saved ${villages.length} sample villages`);
    }
    
    console.log('\nSample fetch complete! Files saved:');
    console.log('- data/indonesian-districts-sample.json');
    if (villages.length > 0) {
      console.log('- data/indonesian-villages-sample.json');
    }
    
    console.log('\n📊 Summary:');
    console.log(`- Provinces: 34 (complete)`);
    console.log(`- Cities: 514 (complete)`);
    console.log(`- Districts: ${districts.length} (sample)`);
    console.log(`- Villages: ${villages.length} (sample)`);
    
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchSampleDistricts,
  fetchSampleVillages
};