import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { DandisetVersionInfo, DandisetMetadata, PendingChange } from '../types/dandiset';

/**
 * Normalize a path to use consistent dot notation for array indices.
 * Converts "foo[0].bar" to "foo.0.bar" and handles mixed notations.
 * This ensures paths from the tool (dot notation) match paths from the UI (bracket notation).
 */
function normalizePath(path: string): string {
  // Convert bracket notation [n] to dot notation .n
  return path.replace(/\[(\d+)\]/g, '.$1');
}

interface MetadataContextType {
  // Current dandiset info
  dandisetId: string;
  setDandisetId: (id: string) => void;
  version: string;
  setVersion: (version: string) => void;
  
  // Loaded data
  versionInfo: DandisetVersionInfo | null;
  setVersionInfo: (info: DandisetVersionInfo | null) => void;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Pending changes
  pendingChanges: PendingChange[];
  addPendingChange: (path: string, oldValue: unknown, newValue: unknown) => void;
  removePendingChange: (path: string) => void;
  clearPendingChanges: () => void;
  getPendingChangeForPath: (path: string) => PendingChange | undefined;
  
  // API Key
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  
  // Get the current metadata with pending changes applied
  getModifiedMetadata: () => DandisetMetadata | null;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export function MetadataProvider({ children }: { children: ReactNode }) {
  const [dandisetId, setDandisetId] = useState<string>('');
  const [version, setVersion] = useState<string>('draft');
  const [versionInfo, setVersionInfo] = useState<DandisetVersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem('dandi-api-key');
  });

  const setApiKey = useCallback((key: string | null) => {
    if (key) {
      localStorage.setItem('dandi-api-key', key);
    } else {
      localStorage.removeItem('dandi-api-key');
    }
    setApiKeyState(key);
  }, []);

  const addPendingChange = useCallback((path: string, oldValue: unknown, newValue: unknown) => {
    const normalizedPath = normalizePath(path);
    setPendingChanges(prev => {
      // Remove existing change for this path if any
      const filtered = prev.filter(c => c.path !== normalizedPath);
      // Add new change with normalized path
      return [...filtered, { path: normalizedPath, oldValue, newValue }];
    });
  }, []);

  const removePendingChange = useCallback((path: string) => {
    const normalizedPath = normalizePath(path);
    setPendingChanges(prev => prev.filter(c => c.path !== normalizedPath));
  }, []);

  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
  }, []);

  const getPendingChangeForPath = useCallback((path: string) => {
    const normalizedPath = normalizePath(path);
    return pendingChanges.find(c => c.path === normalizedPath);
  }, [pendingChanges]);

  const getModifiedMetadata = useCallback((): DandisetMetadata | null => {
    if (!versionInfo) return null;
    
    // Deep clone the metadata
    const modified = JSON.parse(JSON.stringify(versionInfo.metadata)) as DandisetMetadata;
    
    // Apply pending changes
    for (const change of pendingChanges) {
      const pathParts = change.path.split('.');
      let current: unknown = modified;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (current && typeof current === 'object') {
          current = (current as Record<string, unknown>)[part];
        }
      }
      
      const lastPart = pathParts[pathParts.length - 1];
      if (current && typeof current === 'object') {
        (current as Record<string, unknown>)[lastPart] = change.newValue;
      }
    }
    
    return modified;
  }, [versionInfo, pendingChanges]);

  const value: MetadataContextType = {
    dandisetId,
    setDandisetId,
    version,
    setVersion,
    versionInfo,
    setVersionInfo,
    isLoading,
    setIsLoading,
    error,
    setError,
    pendingChanges,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    getPendingChangeForPath,
    apiKey,
    setApiKey,
    getModifiedMetadata,
  };

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
}

export function useMetadataContext() {
  const context = useContext(MetadataContext);
  if (context === undefined) {
    throw new Error('useMetadataContext must be used within a MetadataProvider');
  }
  return context;
}
