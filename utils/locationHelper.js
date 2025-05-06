// Location mapping to help with geographical searches
const locationMapping = {
  // US cities and states to country
  'miami': 'usa',
  'new york': 'usa',
  'los angeles': 'usa',
  'san francisco': 'usa',
  'chicago': 'usa',
  'orlando': 'usa',
  'las vegas': 'usa',
  'boston': 'usa',
  'seattle': 'usa',
  'washington': 'usa',
  'hawaii': 'usa',
  'florida': 'usa',
  'california': 'usa',
  'new york city': 'usa',
  'nyc': 'usa',
  'la': 'usa',
  'sf': 'usa',
  'dc': 'usa',
  'united states': 'usa',
  'united states of america': 'usa',
  'america': 'usa',
  'us': 'usa',
  
  // European cities to countries
  'paris': 'france',
  'nice': 'france',
  'lyon': 'france',
  'marseille': 'france',
  'london': 'uk',
  'manchester': 'uk',
  'liverpool': 'uk',
  'edinburgh': 'uk',
  'rome': 'italy',
  'milan': 'italy',
  'venice': 'italy',
  'florence': 'italy',
  'berlin': 'germany',
  'munich': 'germany',
  'frankfurt': 'germany',
  'hamburg': 'germany',
  'barcelona': 'spain',
  'madrid': 'spain',
  'seville': 'spain',
  'valencia': 'spain',
  'lisbon': 'portugal',
  'porto': 'portugal',
  'amsterdam': 'netherlands',
  'rotterdam': 'netherlands',
  'brussels': 'belgium',
  'zurich': 'switzerland',
  'geneva': 'switzerland',
  'vienna': 'austria',
  'prague': 'czech republic',
  'budapest': 'hungary',
  'athens': 'greece',
  'santorini': 'greece',
  'mykonos': 'greece',
  'dublin': 'ireland',
  'copenhagen': 'denmark',
  'oslo': 'norway',
  'stockholm': 'sweden',
  'helsinki': 'finland',
  'reykjavik': 'iceland',
  
  // Asian cities to countries
  'tokyo': 'japan',
  'kyoto': 'japan',
  'osaka': 'japan',
  'beijing': 'china',
  'shanghai': 'china',
  'hong kong': 'china',
  'seoul': 'south korea',
  'bangkok': 'thailand',
  'phuket': 'thailand',
  'chiang mai': 'thailand',
  'singapore': 'singapore',
  'bali': 'indonesia',
  'jakarta': 'indonesia',
  'kuala lumpur': 'malaysia',
  'ho chi minh': 'vietnam',
  'hanoi': 'vietnam',
  'mumbai': 'india',
  'delhi': 'india',
  'agra': 'india',
  'jaipur': 'india',
  'dubai': 'uae',
  'abu dhabi': 'uae',
  
  // Continents
  'europe': 'europe',
  'asia': 'asia',
  'africa': 'africa',
  'north america': 'north america',
  'south america': 'south america',
  'australia': 'oceania',
  'oceania': 'oceania',
};

// Helper function to expand search terms with country associations
const expandSearchLocation = (location) => {
  if (!location) return [];
  
  const locationLower = location.toLowerCase().trim();
  const expandedLocations = [locationLower];
  
  // Add country if we have a mapping for this city/location
  if (locationMapping[locationLower]) {
    expandedLocations.push(locationMapping[locationLower]);
  }
  
  // For US cities, also add USA variations
  if (locationMapping[locationLower] === 'usa') {
    expandedLocations.push('united states');
    expandedLocations.push('america');
    expandedLocations.push('united states of america');
  }
  
  return expandedLocations;
};

module.exports = {
  expandSearchLocation,
  locationMapping
};