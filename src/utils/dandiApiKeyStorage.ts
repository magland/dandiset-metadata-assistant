export type StorageType = "session" | "local";

function storageKey(instanceApiUrl: string): string {
  return `dandi-api-key::${instanceApiUrl}`;
}

/**
 * Gets the stored DANDI API key for the given instance.
 * Checks session storage first, then falls back to local storage.
 */
export const getStoredDandiApiKey = (instanceApiUrl: string): string | null => {
  try {
    const key = storageKey(instanceApiUrl);
    const sessionKey = sessionStorage.getItem(key);
    if (sessionKey) {
      return sessionKey;
    }
    return localStorage.getItem(key);
  } catch (error) {
    console.error("Error reading DANDI API key from storage:", error);
    return null;
  }
};

/**
 * Saves the DANDI API key for the given instance to the specified storage type.
 * When saving to one storage type, clears the key from the other type.
 */
export const setStoredDandiApiKey = (apiKey: string, storageType: StorageType, instanceApiUrl: string): void => {
  try {
    const key = storageKey(instanceApiUrl);
    if (storageType === "session") {
      sessionStorage.setItem(key, apiKey);
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, apiKey);
      sessionStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error saving DANDI API key to ${storageType} storage:`, error);
  }
};

/**
 * Clears the DANDI API key for the given instance from both session and local storage.
 */
export const clearStoredDandiApiKey = (instanceApiUrl: string): void => {
  try {
    const key = storageKey(instanceApiUrl);
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error clearing DANDI API key from storage:", error);
  }
};

/**
 * Gets the current storage type where the API key is stored for the given instance.
 * Returns null if no key is stored.
 */
export const getCurrentStorageType = (instanceApiUrl: string): StorageType | null => {
  try {
    const key = storageKey(instanceApiUrl);
    if (sessionStorage.getItem(key)) {
      return "session";
    }
    if (localStorage.getItem(key)) {
      return "local";
    }
    return null;
  } catch (error) {
    console.error("Error determining storage type:", error);
    return null;
  }
};
