import { supabase } from '../lib/supabaseClient';
import { validateBirdLocation } from './birdRanges';
import type { LocationSharePreference } from '../types';

// ============================================
// TYPES
// ============================================

export interface SightingData {
  birdId: string;
  birdName: string;
  birdSciName?: string;
  birdRarity?: string;
  lat: number;
  lng: number;
}

export interface SightingResult {
  success: boolean;
  sightingId?: string;
  flagged?: boolean;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  shouldFlag: boolean;
  reason?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Round coordinates for privacy (~200m precision)
 */
const roundCoordinates = (lat: number, lng: number): { lat: number; lng: number } => {
  return {
    lat: Math.round(lat * 500) / 500,  // ~200m precision
    lng: Math.round(lng * 500) / 500
  };
};

/**
 * Check if coordinates are within Germany
 */
const isInGermany = (lat: number, lng: number): boolean => {
  return lat >= 47.2 && lat <= 55.1 && lng >= 5.8 && lng <= 15.1;
};

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Validate a bird sighting location
 */
export const validateSighting = (
  birdId: string,
  lat: number,
  lng: number
): ValidationResult => {
  // If outside Germany, assume vacation mode - no validation
  if (!isInGermany(lat, lng)) {
    return { valid: true, shouldFlag: false };
  }
  
  return validateBirdLocation(birdId, lat, lng);
};

/**
 * Save a bird sighting to the database
 */
export const saveSighting = async (
  userId: string,
  data: SightingData,
  forceFlag: boolean = false
): Promise<SightingResult> => {
  try {
    // Round coordinates for privacy
    const { lat, lng } = roundCoordinates(data.lat, data.lng);
    
    // Validate location
    const validation = validateSighting(data.birdId, data.lat, data.lng);
    const shouldFlag = forceFlag || validation.shouldFlag;
    
    // Insert sighting
    const { data: sighting, error } = await supabase
      .from('bird_sightings')
      .insert({
        user_id: userId,
        bird_id: data.birdId,
        bird_name: data.birdName,
        bird_sci_name: data.birdSciName,
        bird_rarity: data.birdRarity,
        lat,
        lng,
        sighted_at: new Date().toISOString().split('T')[0],
        flagged: shouldFlag,
        flag_reason: shouldFlag ? (validation.reason || 'User confirmed unusual sighting') : null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save sighting:', error);
      return { success: false, error: error.message };
    }

    // If flagged, send notification (via edge function or webhook)
    if (shouldFlag && sighting) {
      await notifyFlaggedSighting({
        sightingId: sighting.id,
        birdName: data.birdName,
        lat,
        lng,
        reason: validation.reason || 'User confirmed unusual sighting',
        userId
      });
    }

    return {
      success: true,
      sightingId: sighting?.id,
      flagged: shouldFlag
    };
  } catch (e) {
    console.error('Sighting save error:', e);
    return { success: false, error: 'Unbekannter Fehler' };
  }
};

/**
 * Get user's location sharing preference
 */
export const getLocationSharePreference = async (userId: string): Promise<'always' | 'never' | 'ask'> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('share_location')
      .eq('id', userId)
      .single();
    
    return data?.share_location || 'ask';
  } catch {
    return 'ask';
  }
};

/**
 * Update user's location sharing preference
 */
export const setLocationSharePreference = async (
  userId: string,
  preference: 'always' | 'never' | 'ask'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ share_location: preference })
      .eq('id', userId);
    
    return !error;
  } catch {
    return false;
  }
};

/**
 * Get recent sightings for the radar map
 */
export const getRecentSightings = async (
  lat: number,
  lng: number,
  radiusKm: number = 50,
  daysBack: number = 7
) => {
  try {
    // Try RPC function first
    const { data, error } = await supabase.rpc('get_nearby_sightings', {
      user_lat: lat,
      user_lng: lng,
      radius_km: radiusKm,
      days_back: daysBack
    });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('RPC failed, using fallback query:', e);
    
    // Fallback: simple query without distance filtering
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysBack);
    
    const { data } = await supabase
      .from('bird_sightings')
      .select('*')
      .eq('flagged', false)
      .gte('sighted_at', dateLimit.toISOString().split('T')[0])
      .order('sighted_at', { ascending: false })
      .limit(500);
    
    return data || [];
  }
};

/**
 * Get user's own sightings
 */
export const getUserSightings = async (userId: string, limit: number = 50) => {
  try {
    const { data } = await supabase
      .from('bird_sightings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return data || [];
  } catch {
    return [];
  }
};

/**
 * Delete a user's own sighting
 */
export const deleteSighting = async (userId: string, sightingId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bird_sightings')
      .delete()
      .eq('id', sightingId)
      .eq('user_id', userId);
    
    return !error;
  } catch {
    return false;
  }
};

// ============================================
// NOTIFICATION HELPER
// ============================================

interface FlagNotification {
  sightingId: string;
  birdName: string;
  lat: number;
  lng: number;
  reason: string;
  userId: string;
}

/**
 * Send notification for flagged sighting
 * Uses Supabase Edge Function or direct email API
 */
const notifyFlaggedSighting = async (data: FlagNotification): Promise<void> => {
  try {
    // Option 1: Call Supabase Edge Function
    await supabase.functions.invoke('notify-flagged-sighting', {
      body: data
    });
  } catch (e) {
    console.error('Failed to send flag notification:', e);
    
    // Option 2: Fallback - log to console for now
    console.warn('FLAGGED SIGHTING:', data);
    
    // You could also use a direct email API here as fallback
    // e.g., Resend, SendGrid, etc.
  }
};

// ============================================
// STATS HELPERS
// ============================================

/**
 * Get sighting statistics for a user
 */
export const getUserSightingStats = async (userId: string) => {
  try {
    const { data, count } = await supabase
      .from('bird_sightings')
      .select('bird_id', { count: 'exact' })
      .eq('user_id', userId);
    
    // Count unique birds
    const uniqueBirds = new Set(data?.map(s => s.bird_id) || []);
    
    return {
      totalSightings: count || 0,
      uniqueSpecies: uniqueBirds.size
    };
  } catch {
    return { totalSightings: 0, uniqueSpecies: 0 };
  }
};

/**
 * Get hotspots (locations with most sightings)
 */
export const getHotspots = async (daysBack: number = 7, limit: number = 10) => {
  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysBack);
    
    const { data } = await supabase
      .from('bird_sightings')
      .select('lat, lng, bird_name')
      .eq('flagged', false)
      .gte('sighted_at', dateLimit.toISOString().split('T')[0]);
    
    if (!data) return [];
    
    // Group by rounded location
    const locationCounts = new Map<string, { lat: number; lng: number; count: number; birds: Set<string> }>();
    
    data.forEach(s => {
      const key = `${Math.round(s.lat * 100) / 100},${Math.round(s.lng * 100) / 100}`;
      const existing = locationCounts.get(key);
      if (existing) {
        existing.count++;
        existing.birds.add(s.bird_name);
      } else {
        locationCounts.set(key, {
          lat: s.lat,
          lng: s.lng,
          count: 1,
          birds: new Set([s.bird_name])
        });
      }
    });
    
    // Sort by count and return top N
    return Array.from(locationCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(h => ({
        lat: h.lat,
        lng: h.lng,
        sightingCount: h.count,
        speciesCount: h.birds.size
      }));
  } catch {
    return [];
  }
};
