export interface DandiInstance {
  name: string;
  apiUrl: string;
  webUrl: string;
}

export const DANDI_INSTANCES: DandiInstance[] = [
  {
    name: 'DANDI Production',
    apiUrl: 'https://api.dandiarchive.org/api',
    webUrl: 'https://dandiarchive.org',
  },
  {
    name: 'DANDI Sandbox',
    apiUrl: 'https://api.sandbox.dandiarchive.org/api',
    webUrl: 'https://sandbox.dandiarchive.org',
  },
  {
    name: 'EMBER',
    apiUrl: 'https://api-dandi.emberarchive.org/api',
    webUrl: 'https://dandi.emberarchive.org',
  },
];

export const DEFAULT_INSTANCE = DANDI_INSTANCES[0];

const SELECTED_INSTANCE_KEY = 'dandi-selected-instance-url';

export function getInstanceByApiUrl(apiUrl: string): DandiInstance | undefined {
  return DANDI_INSTANCES.find((i) => i.apiUrl === apiUrl);
}

export function getStoredInstance(): DandiInstance {
  try {
    const storedUrl = localStorage.getItem(SELECTED_INSTANCE_KEY);
    if (storedUrl) {
      const found = DANDI_INSTANCES.find((i) => i.apiUrl === storedUrl);
      if (found) return found;
    }
  } catch {
    // ignore
  }
  return DEFAULT_INSTANCE;
}

export function getInitialInstance(): DandiInstance {
  try {
    const params = new URLSearchParams(window.location.search);
    const instanceUrl = params.get('instance');
    if (instanceUrl) {
      const found = getInstanceByApiUrl(instanceUrl);
      if (found) return found;
    }
  } catch {
    // ignore
  }
  return getStoredInstance();
}

export function setStoredInstance(instance: DandiInstance): void {
  try {
    localStorage.setItem(SELECTED_INSTANCE_KEY, instance.apiUrl);
  } catch {
    // ignore
  }
}
