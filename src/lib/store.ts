import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { ProfileHitOptional } from "~/types/typesense";

const CACHE_VERSION = "1.0";
const MAX_PROFILES_IN_STORAGE = 2000; // Limit profiles to prevent quota exceeded
const STORAGE_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB limit to stay safe

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

// Create persistent atom for profiles using localStorage
export const allProfilesAtom = atomWithStorage<{
  data: ProfileHitOptional[];
  version: string;
  timestamp: number;
  isComplete: boolean;
}>("typesense-all-profiles", {
  data: [],
  version: CACHE_VERSION,
  timestamp: 0,
  isComplete: false,
});

// Derived atom to get just the profile data
export const profileDataAtom = atom(
  (get) => get(allProfilesAtom).data,
  (get, set, newProfiles: ProfileHitOptional[]) => {
    const current = get(allProfilesAtom);
    
    // Limit profiles to prevent storage quota exceeded
    let profilesToStore = newProfiles;
    if (newProfiles.length > MAX_PROFILES_IN_STORAGE) {
      profilesToStore = newProfiles.slice(0, MAX_PROFILES_IN_STORAGE);
      console.warn(`⚠️ Limiting profiles to ${MAX_PROFILES_IN_STORAGE} to prevent storage quota exceeded`);
    }
    
    const newData = {
      ...current,
      data: profilesToStore,
      timestamp: Date.now(),
    };
    
    // Check storage size before saving
    const estimatedSize = estimateStorageSize(newData);
    if (estimatedSize > STORAGE_SIZE_LIMIT) {
      console.warn(`⚠️ Storage size would exceed limit (${estimatedSize} bytes), reducing profiles`);
      // Reduce by 25% and try again
      const reducedProfiles = profilesToStore.slice(0, Math.floor(profilesToStore.length * 0.75));
      newData.data = reducedProfiles;
    }
    
    try {
      set(allProfilesAtom, newData);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      // Fallback: try with just the first 1000 profiles
      try {
        set(allProfilesAtom, {
          ...current,
          data: profilesToStore.slice(0, 1000),
          timestamp: Date.now(),
        });
        console.warn('⚠️ Saved only first 1000 profiles due to storage constraints');
      } catch (fallbackError) {
        console.error('Failed to save even reduced data:', fallbackError);
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
    availableSpace,
    profileCount: current.data.length,
    isNearLimit: currentSize > STORAGE_SIZE_LIMIT * 0.8, // 80% of limit
    maxProfiles: MAX_PROFILES_IN_STORAGE,
  };
});
