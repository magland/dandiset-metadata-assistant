const DANDI_API_KEY_STORAGE_KEY = "dandi-api-key";

export type StorageType = "session" | "local";

/**
 * Gets the stored DANDI API key.
 * Checks session storage first, then falls back to local storage.
 */
export const getStoredDandiApiKey = (): string | null => {
  try {
    // Check session storage first
    const sessionKey = sessionStorage.getItem(DANDI_API_KEY_STORAGE_KEY);
    if (sessionKey) {
      return sessionKey;
    }
    // Fall back to local storage
    return localStorage.getItem(DANDI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Error reading DANDI API key from storage:", error);
    return null;
  }
};

/**
 * Saves the DANDI API key to the specified storage type.
 * When saving to one storage type, clears the key from the other type.
 */
export const setStoredDandiApiKey = (apiKey: string, storageType: StorageType): void => {
  try {
    if (storageType === "session") {
      // Save to session storage
      sessionStorage.setItem(DANDI_API_KEY_STORAGE_KEY, apiKey);
      // Clear from local storage
      localStorage.removeItem(DANDI_API_KEY_STORAGE_KEY);
    } else {
      // Save to local storage
      localStorage.setItem(DANDI_API_KEY_STORAGE_KEY, apiKey);
      // Clear from session storage
      sessionStorage.removeItem(DANDI_API_KEY_STORAGE_KEY);
    }
  } catch (error) {
    console.error(`Error saving DANDI API key to ${storageType} storage:`, error);
  }
};

/**
 * Clears the DANDI API key from both session and local storage.
 */
export const clearStoredDandiApiKey = (): void => {
  try {
    sessionStorage.removeItem(DANDI_API_KEY_STORAGE_KEY);
    localStorage.removeItem(DANDI_API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing DANDI API key from storage:", error);
  }
};

/**
 * Gets the current storage type where the API key is stored.
 * Returns null if no key is stored.
 */
export const getCurrentStorageType = (): StorageType | null => {
  try {
    if (sessionStorage.getItem(DANDI_API_KEY_STORAGE_KEY)) {
      return "session";
    }
    if (localStorage.getItem(DANDI_API_KEY_STORAGE_KEY)) {
      return "local";
    }
    return null;
  } catch (error) {
    console.error("Error determining storage type:", error);
    return null;
  }
};
