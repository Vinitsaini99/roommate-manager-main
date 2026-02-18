/**
 * Persistent settings storage using localStorage
 * All PG configuration stored locally in browser
 */

const STORAGE_KEY = "rentease_app_settings";

export interface Settings {
  totalRooms: number;
  electricityRate: number;
  rentRates: {
    singleNonAC: number;
    singleAC: number;
    doubleNonAC: number;
    doubleAC: number;
    tripleNonAC: number;
    tripleAC: number;
  };
}

const DEFAULT_SETTINGS: Settings = {
  electricityRate: 8,
  totalRooms: 0,
  rentRates: {
    singleNonAC: 3000,
    singleAC: 4000,
    doubleNonAC: 6000,
    doubleAC: 10000,
    tripleNonAC: 9000,
    tripleAC: 14000,
  },
};

/**
 * Load settings from localStorage
 * If empty → create defaults
 * Always return valid object
 */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Create defaults if not found
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Settings;
    // Ensure all required fields exist (merge with defaults for safety)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      rentRates: {
        ...DEFAULT_SETTINGS.rentRates,
        ...parsed.rentRates,
      },
    };
  } catch (e) {
    console.error("Failed to load settings, using defaults:", e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage
 */
export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

/**
 * Merge partial settings update with existing settings
 * Save and return updated settings
 */
export function updateSettings(partial: Partial<Settings>): Settings {
  const current = loadSettings();
  const updated: Settings = {
    ...current,
    ...partial,
    rentRates: {
      ...current.rentRates,
      ...(partial.rentRates || {}),
    },
  };
  saveSettings(updated);
  return updated;
}
