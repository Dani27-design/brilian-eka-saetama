const fs = require('fs');

// Helper function to convert to title case
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// Special cases for Indonesian region names
function formatIndonesianName(name) {
  const specialCases = {
    'Dki Jakarta': 'DKI Jakarta',
    'Di Yogyakarta': 'DI Yogyakarta',
    'Kepulauan': 'Kepulauan',
    'Dan': 'dan',
    'Dan ': 'dan ',
    ' Dan ': ' dan ',
    'Utara': 'Utara',
    'Selatan': 'Selatan',
    'Barat': 'Barat',
    'Timur': 'Timur',
    'Tengah': 'Tengah'
  };
  
  let formatted = toTitleCase(name);
  
  // Apply special cases
  for (const [incorrect, correct] of Object.entries(specialCases)) {
    formatted = formatted.replace(new RegExp(incorrect, 'gi'), correct);
  }
  
  return formatted;
}

function cleanProvinces() {
  console.log('Cleaning provinces data...');
  const provinces = JSON.parse(fs.readFileSync('./data/indonesian-provinces-complete.json', 'utf8'));
  
  const cleanedProvinces = provinces.map(province => ({
    id: province.id,
    name: formatIndonesianName(province.name)
  }));
  
  fs.writeFileSync('./data/indonesian-provinces.json', JSON.stringify(cleanedProvinces, null, 2));
  console.log(`✓ Cleaned ${cleanedProvinces.length} provinces`);
}

function cleanCities() {
  console.log('Cleaning cities data...');
  const cities = JSON.parse(fs.readFileSync('./data/indonesian-cities-complete.json', 'utf8'));
  
  const cleanedCities = cities.map(city => {
    // Determine type based on name prefix
    const name = formatIndonesianName(city.name);
    let type = 'kabupaten';
    let cleanName = name;
    
    if (name.startsWith('Kota ')) {
      type = 'kota';
      cleanName = name.replace('Kota ', '');
    } else if (name.startsWith('Kabupaten ')) {
      type = 'kabupaten';
      cleanName = name.replace('Kabupaten ', '');
    }
    
    return {
      id: city.id,
      name: cleanName,
      provinceId: city.provinceId,
      type: type
    };
  });
  
  fs.writeFileSync('./data/indonesian-cities.json', JSON.stringify(cleanedCities, null, 2));
  console.log(`✓ Cleaned ${cleanedCities.length} cities`);
}

function main() {
  console.log('Starting data cleaning...');
  cleanProvinces();
  cleanCities();
  console.log('Data cleaning complete!');
}

if (require.main === module) {
  main();
}

module.exports = {
  formatIndonesianName,
  cleanProvinces,
  cleanCities
};