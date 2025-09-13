const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_URLS = {
  hanifabd: 'https://raw.githubusercontent.com/hanifabd/wilayah-indonesia-area/main/data',
  ibnux: 'https://ibnux.github.io/data-indonesia'
};

// Helper function to fetch JSON data with retries
function fetchJSON(url, retries = 3) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          if (response.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            throw new Error(`HTTP ${response.statusCode}: ${url}`);
          }
        } catch (error) {
          if (retries > 0) {
            console.log(`Retrying ${url} (${retries} attempts left)...`);
            setTimeout(() => {
              fetchJSON(url, retries - 1).then(resolve).catch(reject);
            }, 1000);
          } else {
            reject(error);
          }
        }
      });
    });
    
    request.on('error', (error) => {
      if (retries > 0) {
        console.log(`Retrying ${url} due to error (${retries} attempts left)...`);
        setTimeout(() => {
          fetchJSON(url, retries - 1).then(resolve).catch(reject);
        }, 1000);
      } else {
        reject(error);
      }
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      if (retries > 0) {
        console.log(`Retrying ${url} due to timeout (${retries} attempts left)...`);
        fetchJSON(url, retries - 1).then(resolve).catch(reject);
      } else {
        reject(new Error(`Request timeout: ${url}`));
      }
    });
  });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch complete districts data
 */
async function fetchCompleteDistricts() {
  console.log('📍 Fetching complete districts data...');
  
  const allDistricts = [];
  let successCount = 0;
  let errorCount = 0;
  
  // Get all cities first
  const cities = JSON.parse(fs.readFileSync('./data/indonesian-cities.json', 'utf8'));
  console.log(`Found ${cities.length} cities to process...`);
  
  for (const city of cities) {
    try {
      console.log(`Fetching districts for ${city.name} (${city.id})...`);
      
      // Try ibnux format first (more structured)
      let districts;
      try {
        districts = await fetchJSON(`${BASE_URLS.ibnux}/kecamatan/${city.id}.json`);
      } catch (ibnuxError) {
        // Fallback to emsifa API
        districts = await fetchJSON(`http://www.emsifa.com/api-wilayah-indonesia/api/districts/${city.id}.json`);
      }
      
      // Transform to our format
      const districtData = districts.map(district => ({
        id: district.id,
        name: district.name || district.nama,
        cityId: district.regency_id || district.kabupaten_id || city.id
      }));
      
      allDistricts.push(...districtData);
      successCount++;
      
      // Rate limiting
      await delay(100);
      
    } catch (error) {
      console.error(`❌ Error fetching districts for ${city.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`✅ Districts fetch complete: ${successCount} cities processed, ${errorCount} errors`);
  console.log(`📊 Total districts: ${allDistricts.length}`);
  
  return allDistricts;
}

/**
 * Fetch complete villages data (progressive approach due to size)
 */
async function fetchCompleteVillages(maxDistricts = null) {
  console.log('🏘️ Fetching complete villages data...');
  
  const allVillages = [];
  let successCount = 0;
  let errorCount = 0;
  
  // Get districts data
  let districts;
  if (fs.existsSync('./data/indonesian-districts-complete.json')) {
    districts = JSON.parse(fs.readFileSync('./data/indonesian-districts-complete.json', 'utf8'));
  } else {
    console.log('Districts data not found, using sample...');
    districts = JSON.parse(fs.readFileSync('./data/indonesian-districts-sample.json', 'utf8'));
  }
  
  // Limit for testing if specified
  if (maxDistricts) {
    districts = districts.slice(0, maxDistricts);
    console.log(`🧪 Testing mode: processing first ${maxDistricts} districts`);
  }
  
  console.log(`Found ${districts.length} districts to process...`);
  
  for (const district of districts) {
    try {
      console.log(`Fetching villages for ${district.name} (${district.id})...`);
      
      // Try ibnux format first
      let villages;
      try {
        villages = await fetchJSON(`${BASE_URLS.ibnux}/kelurahan/${district.id}.json`);
      } catch (ibnuxError) {
        // Fallback to emsifa API
        villages = await fetchJSON(`http://www.emsifa.com/api-wilayah-indonesia/api/villages/${district.id}.json`);
      }
      
      // Transform to our format
      const villageData = villages.map(village => ({
        id: village.id,
        name: village.name || village.nama,
        districtId: village.district_id || village.kecamatan_id || district.id,
        type: village.type || 'desa' // Default type if not specified
      }));
      
      allVillages.push(...villageData);
      successCount++;
      
      // More aggressive rate limiting for villages (larger dataset)
      await delay(150);
      
    } catch (error) {
      console.error(`❌ Error fetching villages for ${district.name}:`, error.message);
      errorCount++;
      
      // Continue processing other districts
      continue;
    }
  }
  
  console.log(`✅ Villages fetch complete: ${successCount} districts processed, ${errorCount} errors`);
  console.log(`📊 Total villages: ${allVillages.length}`);
  
  return allVillages;
}

/**
 * Fetch data from hanifabd repository (alternative source)
 */
async function fetchFromHanifabd() {
  console.log('📥 Trying alternative source: hanifabd repository...');
  
  try {
    // Try to get the complete dataset files
    const urls = [
      `${BASE_URLS.hanifabd}/list_of_area/districts.json`,
      `${BASE_URLS.hanifabd}/list_of_area/villages.json`,
      `${BASE_URLS.hanifabd}/districts.json`,
      `${BASE_URLS.hanifabd}/villages.json`
    ];
    
    for (const url of urls) {
      try {
        console.log(`Trying ${url}...`);
        const data = await fetchJSON(url);
        console.log(`✅ Found data at ${url} with ${Array.isArray(data) ? data.length : Object.keys(data).length} records`);
        return data;
      } catch (error) {
        console.log(`❌ Failed: ${url}`);
      }
    }
    
    throw new Error('No accessible data files found');
    
  } catch (error) {
    console.error('❌ Could not fetch from hanifabd repository:', error.message);
    return null;
  }
}

/**
 * Create search index for performance
 */
function createSearchIndex(data, fields = ['name']) {
  const index = new Map();
  
  data.forEach((item, idx) => {
    fields.forEach(field => {
      if (item[field]) {
        const value = item[field].toLowerCase();
        
        // Index each word
        const words = value.split(/\\s+/);
        words.forEach(word => {
          if (!index.has(word)) {
            index.set(word, []);
          }
          index.get(word).push(idx);
        });
        
        // Index full value
        if (!index.has(value)) {
          index.set(value, []);
        }
        index.get(value).push(idx);
      }
    });
  });
  
  // Convert Map to Object for JSON serialization
  const indexObj = {};
  index.forEach((indices, key) => {
    indexObj[key] = [...new Set(indices)]; // Remove duplicates
  });
  
  return indexObj;
}

/**
 * Main function
 */
async function main() {
  console.log('🇮🇩 Starting Complete Indonesian Administrative Data Fetch');
  console.log('='.repeat(60));
  console.log('Target: 7,288 districts + 84,210 villages');
  console.log('');
  
  try {
    // 1. Fetch complete districts
    console.log('PHASE 1: Complete Districts Data');
    console.log('-'.repeat(40));
    
    const districts = await fetchCompleteDistricts();
    
    if (districts.length > 0) {
      // Create search index for districts
      const districtSearchIndex = createSearchIndex(districts, ['name']);
      
      fs.writeFileSync('./data/indonesian-districts-complete.json', JSON.stringify(districts, null, 2));
      fs.writeFileSync('./data/indonesian-districts-search-index.json', JSON.stringify(districtSearchIndex, null, 2));
      
      console.log(`✅ Saved ${districts.length} districts to indonesian-districts-complete.json`);
      console.log(`✅ Created search index with ${Object.keys(districtSearchIndex).length} terms`);
    }
    
    // 2. Fetch villages (start with sample, then complete)
    console.log('\\nPHASE 2: Complete Villages Data');
    console.log('-'.repeat(40));
    console.log('⚠️  Starting with first 50 districts for testing...');
    
    const villages = await fetchCompleteVillages(50); // Start with 50 districts for testing
    
    if (villages.length > 0) {
      // Create search index for villages
      const villageSearchIndex = createSearchIndex(villages, ['name']);
      
      fs.writeFileSync('./data/indonesian-villages-partial.json', JSON.stringify(villages, null, 2));
      fs.writeFileSync('./data/indonesian-villages-search-index.json', JSON.stringify(villageSearchIndex, null, 2));
      
      console.log(`✅ Saved ${villages.length} villages to indonesian-villages-partial.json`);
      console.log(`✅ Created search index with ${Object.keys(villageSearchIndex).length} terms`);
    }
    
    // 3. Summary
    console.log('\\n📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Districts: ${districts.length} / 7,288 (${Math.round((districts.length / 7288) * 100)}%)`);
    console.log(`Villages: ${villages.length} / 84,210 (${Math.round((villages.length / 84210) * 100)}%)`);
    console.log('');
    console.log('📁 Files created:');
    console.log('   • data/indonesian-districts-complete.json');
    console.log('   • data/indonesian-districts-search-index.json');
    console.log('   • data/indonesian-villages-partial.json');
    console.log('   • data/indonesian-villages-search-index.json');
    console.log('');
    
    if (districts.length >= 7000) {
      console.log('🎉 Districts data is nearly complete!');
    }
    
    if (villages.length >= 10000) {
      console.log('🎉 Villages data collection is well underway!');
    }
    
    console.log('\\n💡 To fetch ALL villages (84,210), run:');
    console.log('   node scripts/fetch-complete-indonesian-data.js --full-villages');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const fullVillages = args.includes('--full-villages');

if (fullVillages) {
  console.log('🚀 FULL VILLAGES MODE ENABLED');
  console.log('This will fetch ALL 84,210 villages (may take 2-3 hours)');
  
  // Replace the fetchCompleteVillages call in main()
  main = async function() {
    console.log('🇮🇩 Starting COMPLETE Indonesian Villages Data Fetch');
    console.log('='.repeat(60));
    
    const villages = await fetchCompleteVillages(); // No limit = all districts
    
    if (villages.length > 0) {
      const villageSearchIndex = createSearchIndex(villages, ['name']);
      
      fs.writeFileSync('./data/indonesian-villages-complete.json', JSON.stringify(villages, null, 2));
      fs.writeFileSync('./data/indonesian-villages-search-index.json', JSON.stringify(villageSearchIndex, null, 2));
      
      console.log(`✅ Saved ${villages.length} villages to indonesian-villages-complete.json`);
      console.log(`🎉 Complete villages data fetch finished!`);
    }
  };
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchCompleteDistricts,
  fetchCompleteVillages,
  fetchFromHanifabd,
  createSearchIndex
};