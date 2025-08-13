import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { ProfileHitOptional } from "~/types/typesense";

const CACHE_VERSION = "2.0"; // Updated version for new minimal storage format
const CACHE_WINDOW_SIZE = 1000; // Only cache 1000 most recent profiles
const MAX_SKILLS = 5; // Limit skills to first 5
const MAX_COMPANIES = 3; // Limit companies to first 3

// Minimal profile interface for storage - only essential fields
interface MinimalProfile {
  id: string;
  name: string;
  username?: string;
  title?: string;
  location?: string;
  photourl?: string;
  profilePhotoUrl?: string;
  skills?: string[];
  companies?: string[];
  website?: string;
  followers_count?: number;
}

// Convert full profile to minimal profile for storage
function toMinimalProfile(profile: ProfileHitOptional): MinimalProfile {
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    title: profile.title,
    location: profile.location,
    photourl: profile.photourl,
    profilePhotoUrl: profile.profilePhotoUrl,
    skills: profile.skills?.slice(0, MAX_SKILLS), // Only store first 5 skills
    companies: profile.companies?.slice(0, MAX_COMPANIES), // Only store first 3 companies
    website: profile.website,
    followers_count: profile.followers_count,
  };
}

// Convert minimal profile back to full profile (with limited data)
function fromMinimalProfile(minimal: MinimalProfile): ProfileHitOptional {
  return {
    ...minimal,
    // Add any missing required fields with defaults
    objectID: minimal.id,
  } as ProfileHitOptional;
}

// Helper function to estimate storage size
function estimateStorageSize(data: unknown): number {
  return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per character
}

// Helper function to check localStorage available space
function getStorageAvailableSpace(): number {
  try {
    const testKey = '__storage_test__';
    const testValue = 'x';
    let size = 0;
    
    // Try increasing sizes until we hit the limit
    for (let i = 0; i < 20; i++) { // Max 20 iterations to prevent infinite loop
      try {
        localStorage.setItem(testKey, testValue.repeat(Math.pow(2, i)));
        localStorage.removeItem(testKey);
        size = Math.pow(2, i);
      } catch {
        break;
      }
    }
    
    return size * 2; // Rough available space
  } catch {
    return 0;
  }
}

// Create persistent atom for minimal profiles using localStorage
export const allProfilesAtom = atomWithStorage<{
  data: MinimalProfile[];
  version: string;
  timestamp: number;
  isComplete: boolean;
}>("typesense-all-profiles", {
  data: [],
  version: CACHE_VERSION,
  timestamp: 0,
  isComplete: false,
});

// Derived atom to get profile data (converts minimal back to full)
export const profileDataAtom = atom(
  (get) => {
    const minimalProfiles = get(allProfilesAtom).data;
    return minimalProfiles.map(fromMinimalProfile);
  },
  (get, set, newProfiles: ProfileHitOptional[]) => {
    const current = get(allProfilesAtom);
    
    // Convert to minimal profiles for storage
    const minimalProfiles = newProfiles.map(toMinimalProfile);
    
    // Implement sliding window cache - only keep most recent profiles
    let profilesToStore = minimalProfiles;
    if (minimalProfiles.length > CACHE_WINDOW_SIZE) {
      // Keep the most recent profiles (assuming they're in chronological order)
      profilesToStore = minimalProfiles.slice(-CACHE_WINDOW_SIZE);
      console.log(`📦 Sliding window cache: keeping ${CACHE_WINDOW_SIZE} most recent profiles`);
    }
    
    const newData = {
      ...current,
      data: profilesToStore,
      timestamp: Date.now(),
    };
    
    // Estimate storage size for monitoring
    const estimatedSize = estimateStorageSize(newData);
    console.log(`💾 Storage size: ${(estimatedSize / 1024).toFixed(1)}KB for ${profilesToStore.length} profiles`);
    
    try {
      set(allProfilesAtom, newData);
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
      // Fallback: try with even smaller window
      try {
        const fallbackSize = Math.floor(CACHE_WINDOW_SIZE / 2);
        const fallbackData = {
          ...current,
          data: profilesToStore.slice(-fallbackSize),
          timestamp: Date.now(),
        };
        set(allProfilesAtom, fallbackData);
        console.warn(`⚠️ Saved only ${fallbackSize} profiles due to storage constraints`);
      } catch (fallbackError) {
        console.error('❌ Failed to save even reduced data:', fallbackError);
        // Clear cache as last resort
        set(allProfilesAtom, {
          data: [],
          version: CACHE_VERSION,
          timestamp: 0,
          isComplete: false,
        });
      }
    }
  },
);

// Derived atom to check if profiles are fully loaded
export const profilesCompleteAtom = atom(
  (get) => get(allProfilesAtom).isComplete,
  (get, set, isComplete: boolean) => {
    const current = get(allProfilesAtom);
    set(allProfilesAtom, {
      ...current,
      isComplete,
      timestamp: Date.now(),
    });
  },
);

// Derived atom for loading state
export const profilesLoadingAtom = atom(false);

// Derived atom to track if initial 50 profiles have been loaded
export const initialLoadCompletedAtom = atom(false);

// Atom to track dynamic page size - starts with 50, then switches to 500
export const dynamicPageSizeAtom = atom(50);

// Derived atom for profile count
export const profileCountAtom = atom((get) => get(allProfilesAtom).data.length);

// Helper atom to clear cache
export const clearProfileCacheAtom = atom(null, (get, set) => {
  set(allProfilesAtom, {
    data: [],
    version: CACHE_VERSION,
    timestamp: 0,
    isComplete: false,
  });
});

// Storage monitoring atom
export const storageStatsAtom = atom((get) => {
  const current = get(allProfilesAtom);
  const currentSize = estimateStorageSize(current);
  const availableSpace = getStorageAvailableSpace();
  
  return {
    currentSize,
    currentSizeKB: Math.round(currentSize / 1024),
    availableSpace,
    profileCount: current.data.length,
    maxCachedProfiles: CACHE_WINDOW_SIZE,
    cacheVersion: CACHE_VERSION,
    maxSkills: MAX_SKILLS,
    maxCompanies: MAX_COMPANIES,
    storageEfficiency: `${Math.round(currentSize / Math.max(current.data.length, 1))} bytes/profile`,
  };
});
