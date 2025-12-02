// ============================================
// BIRD RANGE VALIDATION SYSTEM
// ============================================

/**
 * Range types for bird distribution
 * - common: Found throughout Germany
 * - north: Coastal / Northern Germany
 * - south: Bavaria / Alpine region  
 * - east: Eastern Germany
 * - water: Only near water bodies
 * - mountains: Alps / Mittelgebirge
 * - rare-guest: Very rare vagrant, always flag
 * - vacation: Vacation mode birds, no validation
 */
export type RangeType = 
  | 'common'
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'water'
  | 'mountains'
  | 'alps-only'
  | 'coast-only'
  | 'rare-guest'
  | 'vacation';

// ============================================
// REGION BOUNDING BOXES
// Approximate lat/lng bounds for German regions
// ============================================

interface RegionBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

export const REGION_BOUNDS: Record<string, RegionBounds> = {
  // All of Germany
  'germany': { latMin: 47.2, latMax: 55.1, lngMin: 5.8, lngMax: 15.1 },
  
  // Northern Germany (Schleswig-Holstein, Niedersachsen coast, Mecklenburg-Vorpommern)
  'north': { latMin: 52.5, latMax: 55.1, lngMin: 5.8, lngMax: 14.5 },
  
  // Coastal areas (North Sea & Baltic)
  'coast': { latMin: 53.0, latMax: 55.1, lngMin: 5.8, lngMax: 14.5 },
  
  // Southern Germany (Bavaria, Baden-Württemberg)
  'south': { latMin: 47.2, latMax: 49.8, lngMin: 7.5, lngMax: 13.9 },
  
  // Alpine region (very south of Bavaria)
  'alps': { latMin: 47.2, latMax: 47.8, lngMin: 9.5, lngMax: 13.1 },
  
  // Eastern Germany
  'east': { latMin: 50.0, latMax: 54.5, lngMin: 11.5, lngMax: 15.1 },
  
  // Western Germany (NRW, Rheinland-Pfalz, Saarland)
  'west': { latMin: 49.0, latMax: 52.5, lngMin: 5.8, lngMax: 9.5 },
  
  // Central Germany (Hessen, Thüringen, Sachsen-Anhalt)
  'central': { latMin: 49.5, latMax: 52.5, lngMin: 8.5, lngMax: 13.0 },
  
  // Mountains (Mittelgebirge + Alps)
  'mountains': { latMin: 47.2, latMax: 51.5, lngMin: 7.0, lngMax: 14.0 },
};

// ============================================
// BIRD RANGE ASSIGNMENTS
// Only birds with restricted ranges are listed
// All others default to 'common' (found everywhere)
// ============================================

export const BIRD_RANGES: Record<string, RangeType[]> = {
  // === ALPINE SPECIALISTS ===
  'gaensegeier': ['alps-only'],
  'bartgeier': ['alps-only', 'rare-guest'],
  'steinadler': ['alps-only', 'mountains'],
  'alpendohle': ['alps-only'],
  'alpenschneehuhn': ['alps-only'],
  'alpensegler': ['alps-only', 'south'],
  'mauerlaeufer': ['alps-only'],
  'zitronenzeisig': ['alps-only'],
  'ringdrossel': ['mountains', 'alps-only'],
  'tannenhaeher': ['mountains', 'alps-only'],
  'dreizehenspecht': ['alps-only'],
  'auerhuhn': ['alps-only', 'mountains'],
  'birkhuhn': ['alps-only', 'mountains'],
  'haselhuhn': ['mountains'],
  'schneesperling': ['alps-only'],
  
  // === COASTAL / NORTHERN SPECIALISTS ===
  'austernfischer': ['coast-only', 'north'],
  'sandregenpfeifer': ['coast-only', 'north'],
  'seeregenpfeifer': ['coast-only'],
  'saeblelschnaebler': ['coast-only', 'north'],
  'brandgans': ['coast-only', 'north'],
  'eiderente': ['coast-only'],
  'basstölpel': ['coast-only', 'rare-guest'],
  'tordalk': ['coast-only', 'rare-guest'],
  'trottellumme': ['coast-only', 'rare-guest'],
  'papageitaucher': ['coast-only', 'rare-guest'],
  'krähenscharbe': ['coast-only', 'rare-guest'],
  'küstenseeschwalbe': ['coast-only', 'north'],
  'zwergseeschwalbe': ['coast-only'],
  'brandseeschwalbe': ['coast-only'],
  'silbermoewe': ['coast-only', 'north', 'water'],
  'heringsmoewe': ['coast-only', 'north'],
  'mantelmoewe': ['coast-only', 'north'],
  'sturmmoewe': ['coast-only', 'north', 'water'],
  'dreizehenmoewe': ['coast-only', 'rare-guest'],
  'rotschenkel': ['coast-only', 'north'],
  'uferschnepfe': ['coast-only', 'north'],
  'pfuhlschnepfe': ['coast-only'],
  'knutt': ['coast-only'],
  'alpenstrandlaeufer': ['coast-only', 'north'],
  'sanderling': ['coast-only'],
  'stelzenlaeufer': ['rare-guest'],
  
  // === WATER BIRDS (need water bodies) ===
  'eisvogel': ['water'],
  'wasseramsel': ['water', 'mountains'],
  'teichhuhn': ['water'],
  'blaesshuhn': ['water'],
  'hoeckerschwan': ['water'],
  'graureiher': ['water'],
  'silberreiher': ['water'],
  'zwergtaucher': ['water'],
  'haubentaucher': ['water'],
  'kormoran': ['water'],
  'gaensesaeger': ['water', 'north'],
  'reiherente': ['water'],
  'tafelente': ['water'],
  'schnatterente': ['water'],
  'krickente': ['water'],
  'loeffelente': ['water'],
  'kolbenente': ['water', 'south'],
  'schellente': ['water', 'north'],
  'rohrdommel': ['water', 'rare-guest'],
  'zwergdommel': ['water', 'rare-guest'],
  'nachtreiher': ['water', 'rare-guest'],
  'purpurreiher': ['water', 'rare-guest'],
  'loeffler': ['water', 'north', 'rare-guest'],
  'kranich': ['water', 'north', 'east'],
  'rohrweihe': ['water'],
  'drosselrohrsaenger': ['water'],
  'teichrohrsaenger': ['water'],
  'schilfrohrsaenger': ['water'],
  'bartmeise': ['water'],
  'beutelmeise': ['water'],
  'blaukehlchen': ['water'],
  
  // === EASTERN GERMANY SPECIALISTS ===
  'seeadler': ['water', 'north', 'east'],
  'schreiadler': ['east', 'rare-guest'],
  'seggenrohrsaenger': ['east', 'rare-guest'],
  'grosstrappe': ['east', 'rare-guest'],
  'brachpieper': ['east'],
  'ortolan': ['east', 'north'],
  'sperbergrasmücke': ['east'],
  
  // === SOUTHERN GERMANY ===
  'bienenfresser': ['south', 'rare-guest'],
  'wiedehopf': ['south', 'east', 'rare-guest'],
  'zippammer': ['south'],
  'orpheusgrasmücke': ['south', 'rare-guest'],
  'berglaubsänger': ['south', 'mountains'],
  
  // === RARE VAGRANTS (always flag) ===
  'rosaflamingo': ['rare-guest'],
  'kuhreiher': ['rare-guest'],
  'rallenreiher': ['rare-guest'],
  'seidenreiher': ['rare-guest'],
  'schlangenadler': ['rare-guest'],
  'kaiseradler': ['rare-guest'],
  'roetfalke': ['rare-guest'],
  'steppenweihe': ['rare-guest'],
  'mornellregenpfeifer': ['rare-guest', 'mountains'],
  'thorshuehnchen': ['rare-guest'],
  'schwarzkopfmoewe': ['rare-guest'],
  'weissbartseeschwalbe': ['rare-guest'],
  'trauerseeschwalbe': ['water', 'rare-guest'],
  'raubseeschwalbe': ['rare-guest'],
  'triel': ['rare-guest'],
  'blaumerle': ['rare-guest', 'south'],
  'steinrotel': ['rare-guest', 'alps-only'],
  'zaunammer': ['south', 'rare-guest'],
  'grauammer': ['east'],
  'spornammer': ['rare-guest'],
  'kappenammer': ['rare-guest'],
  'fichtenkreuzschnabel': ['mountains'],
  'bindenkreuzschnabel': ['rare-guest'],
  'hakengimpel': ['rare-guest'],
  'karmingimpel': ['rare-guest', 'east'],
  'zwergschnäpper': ['east', 'rare-guest'],
  'halsbandschnäpper': ['south', 'east'],
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Check if coordinates fall within a region's bounds
 */
const isInRegion = (lat: number, lng: number, region: string): boolean => {
  const bounds = REGION_BOUNDS[region];
  if (!bounds) return true; // Unknown region = allow
  
  return (
    lat >= bounds.latMin &&
    lat <= bounds.latMax &&
    lng >= bounds.lngMin &&
    lng <= bounds.lngMax
  );
};

/**
 * Check if a bird sighting is plausible for the given location
 */
export const validateBirdLocation = (
  birdId: string,
  lat: number,
  lng: number
): { valid: boolean; reason?: string; shouldFlag: boolean } => {
  const ranges = BIRD_RANGES[birdId.toLowerCase()];
  
  // No range restrictions = valid everywhere in Germany
  if (!ranges) {
    // Still check if it's within Germany
    if (!isInRegion(lat, lng, 'germany')) {
      return { 
        valid: true, 
        shouldFlag: false 
      }; // Outside Germany = vacation mode, no validation
    }
    return { valid: true, shouldFlag: false };
  }
  
  // Check if it's a rare guest (always flag but allow)
  const isRareGuest = ranges.includes('rare-guest');
  
  // Check each allowed range
  const rangeToRegion: Record<RangeType, string[]> = {
    'common': ['germany'],
    'north': ['north', 'coast'],
    'south': ['south', 'alps'],
    'east': ['east'],
    'west': ['west'],
    'water': ['germany'], // Water birds can be anywhere there's water
    'mountains': ['mountains', 'alps', 'south'],
    'alps-only': ['alps'],
    'coast-only': ['coast'],
    'rare-guest': ['germany'],
    'vacation': [], // No validation
  };
  
  // Check if location matches any allowed range
  for (const range of ranges) {
    if (range === 'rare-guest') continue; // Handle separately
    if (range === 'vacation') return { valid: true, shouldFlag: false };
    
    const allowedRegions = rangeToRegion[range] || [];
    for (const region of allowedRegions) {
      if (isInRegion(lat, lng, region)) {
        return { 
          valid: true, 
          shouldFlag: isRareGuest,
          reason: isRareGuest ? 'Seltener Gast in Deutschland' : undefined
        };
      }
    }
  }
  
  // Location doesn't match any allowed range
  const rangeNames: Record<RangeType, string> = {
    'common': 'ganz Deutschland',
    'north': 'Norddeutschland',
    'south': 'Süddeutschland',
    'east': 'Ostdeutschland',
    'west': 'Westdeutschland',
    'water': 'an Gewässern',
    'mountains': 'in den Bergen',
    'alps-only': 'in den Alpen',
    'coast-only': 'an der Küste',
    'rare-guest': 'als seltener Gast',
    'vacation': 'weltweit',
  };
  
  const expectedAreas = ranges
    .filter(r => r !== 'rare-guest')
    .map(r => rangeNames[r])
    .join(' oder ');
  
  return {
    valid: false,
    shouldFlag: true,
    reason: `Diese Art kommt normalerweise nur ${expectedAreas} vor.`
  };
};

/**
 * Get a human-readable description of where a bird is typically found
 */
export const getBirdRangeDescription = (birdId: string): string | null => {
  const ranges = BIRD_RANGES[birdId.toLowerCase()];
  if (!ranges) return null;
  
  const descriptions: Record<RangeType, string> = {
    'common': 'In ganz Deutschland verbreitet',
    'north': 'Vor allem in Norddeutschland',
    'south': 'Vor allem in Süddeutschland',
    'east': 'Vor allem in Ostdeutschland',
    'west': 'Vor allem in Westdeutschland',
    'water': 'An Gewässern',
    'mountains': 'Im Bergland',
    'alps-only': 'Nur in den Alpen',
    'coast-only': 'Nur an der Küste',
    'rare-guest': 'Seltener Gast',
    'vacation': 'Weltweit',
  };
  
  return ranges
    .map(r => descriptions[r])
    .filter(Boolean)
    .join(', ');
};
