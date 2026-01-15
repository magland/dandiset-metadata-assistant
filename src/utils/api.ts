import type { DandisetVersionInfo } from '../types/dandiset';

const DANDI_API_BASE = 'https://api.dandiarchive.org/api';

export interface OwnedDandiset {
  identifier: string;
  created: string;
  modified: string;
  embargo_status: string;
  draft_version: {
    version: string;
    name: string;
    status: string;
  };
}

export type DandisetSortOrder = 'modified' | '-modified' | 'id' | '-id';

export async function fetchOwnedDandisets(
  apiKey: string,
  order: DandisetSortOrder = '-modified'
): Promise<OwnedDandiset[]> {
  const url = `${DANDI_API_BASE}/dandisets/?user=me&order=${order}&page_size=100&embargoed=true`;

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${apiKey}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid API key');
    }
    throw new Error(`Failed to fetch owned dandisets: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results as OwnedDandiset[];
}

export async function fetchDandisetVersionInfo(
  dandisetId: string,
  version: string,
  apiKey?: string | null
): Promise<DandisetVersionInfo> {
  const url = `${DANDI_API_BASE}/dandisets/${dandisetId}/versions/${version}/info/`;
  
  const headers: HeadersInit = {};
  if (apiKey) {
    headers['Authorization'] = `token ${apiKey}`;
  }
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Dandiset ${dandisetId} version ${version} not found`);
    }
    throw new Error(`Failed to fetch dandiset info: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data as DandisetVersionInfo;
}

// Proxy server URL - configure based on environment
// const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:8787';
const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'https://dandiset-metadata-proxy.figurl.workers.dev';

export async function commitMetadataChanges(
  dandisetId: string,
  version: string,
  metadata: unknown,
  apiKey: string
): Promise<void> {
  const url = `${PROXY_URL}/commit`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dandisetId,
      version,
      metadata,
      apiKey,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (errorData.validationErrors) {
      throw new Error(`Metadata validation failed: ${errorData.message || 'Invalid metadata'}`);
    }
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please check your API key.');
    }
    
    throw new Error(
      errorData.message || 
      errorData.error || 
      `Failed to commit metadata: ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log('Metadata committed successfully', data);
}

export async function publishDandiset(
  dandisetId: string,
  apiKey: string
): Promise<void> {
  const url = `${PROXY_URL}/publish`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dandisetId,
      apiKey,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication failed. Please check your API key.');
    }
    
    throw new Error(
      errorData.message ||
      errorData.error ||
      `Failed to publish dandiset: ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log('Dandiset published successfully', data);
}
