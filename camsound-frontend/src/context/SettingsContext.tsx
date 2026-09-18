import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface PlatformSettings {
  platformName: string;
  platformDesc: string;
  logoUrl: string;
  logoIcon: string;
  supportEmail: string;
  commissionRate: string;
  maintenanceMode: string;
}

interface SettingsContextType {
  settings: PlatformSettings;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: 'CamSound',
  platformDesc: 'Discover Cameroonian Music',
  logoUrl: '',
  logoIcon: 'fa-drum',
  supportEmail: 'support@camsound.cm',
  commissionRate: '15',
  maintenanceMode: 'off',
};

const CACHE_KEY = 'camsound_platform_settings';

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  refreshSettings: async () => {},
  loading: false,
});

function mapSettings(d: Record<string, string>): PlatformSettings {
  return {
    platformName: d.platformName || d.platform_name || DEFAULT_SETTINGS.platformName,
    platformDesc: d.platformDesc || d.platform_desc || DEFAULT_SETTINGS.platformDesc,
    logoUrl: d.logoUrl || d.logo_url || '',
    logoIcon: d.logoIcon || d.logo_icon || DEFAULT_SETTINGS.logoIcon,
    supportEmail: d.supportEmail || d.support_email || DEFAULT_SETTINGS.supportEmail,
    commissionRate: String(d.commissionRate || d.commission_rate || DEFAULT_SETTINGS.commissionRate),
    maintenanceMode: d.maintenanceMode || d.maintenance_mode || DEFAULT_SETTINGS.maintenanceMode,
  };
}

function loadCached(): PlatformSettings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCache(s: PlatformSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s));
  } catch {}
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from cache so UI shows correct values instantly even before fetch
  const [settings, setSettings] = useState<PlatformSettings>(loadCached() || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSettings = async () => {
    // Try authenticated admin endpoint first, then public endpoint
    const endpoints = ['/api/admin/settings', '/api/settings', '/api/platform/settings'];

    for (const endpoint of endpoints) {
      try {
        const res = await api.get(endpoint);
        if (res.data?.success && res.data?.data && Object.keys(res.data.data).length > 0) {
          const mapped = mapSettings(res.data.data);
          setSettings(mapped);
          saveCache(mapped); // Cache for instant load next time
          return;
        }
      } catch {
        // Try next endpoint
      }
    }
    // All endpoints failed — keep current state (cached or default)
  };

  useEffect(() => {
    refreshSettings().finally(() => setLoading(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const usePlatformSettings = () => useContext(SettingsContext);
