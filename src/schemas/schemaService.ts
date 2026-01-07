/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Service for dynamically fetching and caching DANDI JSON schemas
 */

// Cache for loaded schemas by version
const schemaCache: Map<string, any> = new Map();

// Default schema version to use if none specified
const DEFAULT_SCHEMA_VERSION = "0.7.0";

// Base URL for fetching schemas from the DANDI schema repository
const SCHEMA_BASE_URL =
  "https://raw.githubusercontent.com/dandi/schema/refs/heads/master/releases";

/**
 * Get the schema URL for a given version
 */
export function getSchemaUrl(version: string): string {
  return `${SCHEMA_BASE_URL}/${version}/dandiset.json`;
}

/**
 * Fetch a schema for the given version
 * Returns cached schema if available
 */
export async function fetchSchema(version?: string): Promise<any> {
  const schemaVersion = version || DEFAULT_SCHEMA_VERSION;

  // Check cache first
  if (schemaCache.has(schemaVersion)) {
    return schemaCache.get(schemaVersion);
  }

  const url = getSchemaUrl(schemaVersion);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch schema v${schemaVersion}: ${response.status} ${response.statusText}`
      );
    }

    const schema = await response.json();

    // Cache the schema
    schemaCache.set(schemaVersion, schema);

    return schema;
  } catch (error) {
    console.error(`Error fetching schema v${schemaVersion}:`, error);

    // If fetch fails and we have a different version cached, return that as fallback
    if (schemaCache.size > 0) {
      const firstEntry = schemaCache.entries().next().value;
      if (firstEntry) {
        const [, cachedSchema] = firstEntry;
        console.warn(`Falling back to cached schema`);
        return cachedSchema;
      }
    }

    throw error;
  }
}

/**
 * Preload a schema (useful for initialization)
 */
export async function preloadSchema(version?: string): Promise<void> {
  await fetchSchema(version);
}

/**
 * Get a cached schema synchronously (returns undefined if not cached)
 */
export function getCachedSchema(version?: string): any | undefined {
  const schemaVersion = version || DEFAULT_SCHEMA_VERSION;
  return schemaCache.get(schemaVersion);
}

/**
 * Check if a schema version is cached
 */
export function isSchemacached(version?: string): boolean {
  const schemaVersion = version || DEFAULT_SCHEMA_VERSION;
  return schemaCache.has(schemaVersion);
}

/**
 * Clear the schema cache
 */
export function clearSchemaCache(): void {
  schemaCache.clear();
}

/**
 * Get the default schema version
 */
export function getDefaultSchemaVersion(): string {
  return DEFAULT_SCHEMA_VERSION;
}
