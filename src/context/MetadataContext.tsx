/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { preloadSchema } from '../schemas/schemaService';
import type { DandisetMetadata, DandisetVersionInfo } from '../types/dandiset';
import {
  applyOperation,
  type MetadataOperationType,
  normalizePath,
  getValueAtPath
} from '../core/metadataOperations';

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
  
  // API Key
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  
  // Get the current metadata with pending changes applied
  originalMetadata: DandisetMetadata | null;
  modifiedMetadata: DandisetMetadata | null;
  setOriginalMetadata: (metadata: DandisetMetadata | null) => void;
  setModifiedMetadata: (metadata: DandisetMetadata | null) => void;

  clearModifications: () => void;

  // Metadata modification functions
  modifyMetadata: (operation: MetadataOperationType, path: string, value?: unknown) => boolean;
  revertField: (fieldKey: string) => void;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export function MetadataProvider({ children }: { children: ReactNode }) {
  const [dandisetId, setDandisetId] = useState<string>('');
  const [version, setVersion] = useState<string>('draft');
  const [versionInfo, setVersionInfo] = useState<DandisetVersionInfo | null>(null);
  const [originalMetadata, setOriginalMetadata] = useState<DandisetMetadata | null>(null);
  const [modifiedMetadata, setModifiedMetadata] = useState<DandisetMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem('dandi-api-key');
  });

  // if originalMetadata changes, reset modifiedMetadata
  useEffect(() => {
    setModifiedMetadata(originalMetadata);
  }, [originalMetadata]);

  const setApiKey = useCallback((key: string | null) => {
    if (key) {
      localStorage.setItem('dandi-api-key', key);
    } else {
      localStorage.removeItem('dandi-api-key');
    }
    setApiKeyState(key);
  }, []);

  // Preload JSON schema (always use latest version for validation)
  useEffect(() => {
    if (versionInfo) {
      preloadSchema().catch((err) => {
        console.warn('Failed to preload schema:', err);
      });
    }
  }, [versionInfo]);

  const modifyMetadata = useCallback((operation: MetadataOperationType, path: string, value?: unknown): boolean => {
    const normalizedPath = normalizePath(path);
    
    setModifiedMetadata((modifiedMetadata) => {
      if (modifiedMetadata === null) {
        console.error('No modified metadata to apply operation to.');
        return modifiedMetadata;
      }
      
      const result = applyOperation(modifiedMetadata, operation, normalizedPath, value);
      
      if (!result.success) {
        console.error('Metadata operation failed:', result.error);
        return modifiedMetadata;
      }
      
      return result.data as DandisetMetadata;
    });
    return true;
  }, []);

  const clearModifications = useCallback(() => {
    setModifiedMetadata(originalMetadata);
  }, [originalMetadata]);

  const revertField = useCallback((fieldKey: string) => {
    if (!originalMetadata || !modifiedMetadata) return;
    
    const originalValue = getValueAtPath(originalMetadata, fieldKey);
    const result = applyOperation(modifiedMetadata, 'set', fieldKey, originalValue);
    
    if (result.success) {
      setModifiedMetadata(result.data as DandisetMetadata);
    }
  }, [originalMetadata, modifiedMetadata]);

  const setOriginalMetadata1 = useCallback((metadata: DandisetMetadata | null) => {
    setOriginalMetadata(metadata);
  }, []);

  const setModifiedMetadata1 = useCallback((metadata: DandisetMetadata | null) => {
    setModifiedMetadata(metadata);
  }, []);

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
    modifyMetadata,
    revertField,
    apiKey,
    setApiKey,
    originalMetadata,
    modifiedMetadata,
    setOriginalMetadata: setOriginalMetadata1,
    setModifiedMetadata: setModifiedMetadata1,
    clearModifications
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
