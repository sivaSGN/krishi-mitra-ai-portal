import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { defaultNotifications, defaultProfile } from "@/data/schemes";
import type { AppNotification, FarmerProfile, Language } from "@/types/app";
import { translate } from "@/i18n/translations";
import {
  bulkSaveSchemesInDb,
  clearAllSavedSchemesInDb,
  getFarmerProfileFromDb,
  getSavedSchemesFromDb,
  toggleSavedSchemeInDb,
  upsertFarmerProfileInDb,
} from "@/services/farmer-db";

type AppContextValue = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  language: Language;
  setLanguage: (v: Language) => void;
  savedIds: string[];
  toggleSaved: (id: string) => void;
  saveAllSchemes: (ids: string[]) => void;
  clearAllSaved: () => void;
  notifications: AppNotification[];
  markRead: (id?: string) => void;
  profile: FarmerProfile;
  updateProfile: (p: FarmerProfile) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  isAuthenticated: boolean;
  userMobile: string;
  login: (identifier?: string, name?: string) => Promise<void>;
  logout: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export const t = (language: Language, key: string) => translate(language, key);

export function useTranslation() {
  const { language } = useApp();
  return {
    t: (key: string) => translate(language, key),
    language,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState<Language>("en");
  const [savedIds, setSavedIds] = useState<string[]>(["pm-kisan", "pm-kusum", "kcc"]);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [profile, setProfile] = useState<FarmerProfile>(defaultProfile);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [userMobile, setUserMobile] = useState<string>("9876543210");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = <T,>(k: string, d: T): T => {
      try {
        const v = localStorage.getItem(k);
        return v !== null ? JSON.parse(v) : d;
      } catch {
        return d;
      }
    };
    const loadedTheme = read<"light" | "dark">("km-theme", "light");
    const loadedLang = read<Language>("km-language", "en");
    const loadedSaved = read<string[]>("km-saved", ["pm-kisan", "pm-kusum", "kcc"]);
    const loadedNotifs = read<AppNotification[]>("km-notifications", defaultNotifications);
    const loadedProfile = read<FarmerProfile>("km-profile", defaultProfile);
    const loadedAuth = read<boolean>("km-auth", true);
    const loadedMobile = read<string>("km-user-mobile", "9876543210");

    setTheme(loadedTheme);
    setLanguage(loadedLang);
    setSavedIds(loadedSaved);
    setNotifications(loadedNotifs);
    setProfile(loadedProfile);
    setIsAuthenticated(loadedAuth);
    setUserMobile(loadedMobile);
    setHydrated(true);

    // Fetch latest profile and saved schemes from Supabase in background
    void (async () => {
      if (loadedMobile) {
        const dbResult = await getFarmerProfileFromDb(loadedMobile);
        if (dbResult?.profile) {
          setProfile(dbResult.profile);
        }
        const dbSaved = await getSavedSchemesFromDb(loadedMobile);
        if (dbSaved && dbSaved.length) {
          setSavedIds(dbSaved);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = language;
    localStorage.setItem("km-theme", JSON.stringify(theme));
    localStorage.setItem("km-language", JSON.stringify(language));
    localStorage.setItem("km-saved", JSON.stringify(savedIds));
    localStorage.setItem("km-notifications", JSON.stringify(notifications));
    localStorage.setItem("km-profile", JSON.stringify(profile));
    localStorage.setItem("km-auth", JSON.stringify(isAuthenticated));
    localStorage.setItem("km-user-mobile", JSON.stringify(userMobile));
  }, [hydrated, theme, language, savedIds, notifications, profile, isAuthenticated, userMobile]);

  const login = async (identifier?: string, name?: string) => {
    setIsAuthenticated(true);
    const mobileNum = identifier && /^\d+$/.test(identifier) ? identifier : userMobile || "9876543210";
    setUserMobile(mobileNum);

    // Check if farmer exists in Supabase
    const existing = await getFarmerProfileFromDb(mobileNum);
    if (existing?.profile) {
      setProfile(existing.profile);
      if (existing.language && (["en", "te", "ta", "hi"] as string[]).includes(existing.language)) {
        setLanguage(existing.language as Language);
      }
      const dbSaved = await getSavedSchemesFromDb(mobileNum);
      if (dbSaved && dbSaved.length) {
        setSavedIds(dbSaved);
      }
      toast.success(`Welcome back, ${existing.profile.name}! (Synced from Supabase)`);
    } else {
      const updated = { ...profile, ...(name ? { name } : {}) };
      setProfile(updated);
      await upsertFarmerProfileInDb(updated, mobileNum, language);
      toast.success(`Welcome, ${name || updated.name}! Account saved to Supabase.`);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    toast.info("You have been logged out successfully.");
  };

  const updateProfile = (p: FarmerProfile) => {
    setProfile(p);
    toast.success("Profile updated");
    // Background sync to Supabase
    void upsertFarmerProfileInDb(p, userMobile, language);
  };

  const saveAllSchemes = (ids: string[]) => {
    setSavedIds(ids);
    toast.success(`All ${ids.length} schemes saved to your profile!`);
    void bulkSaveSchemesInDb(userMobile, ids);
  };

  const clearAllSaved = () => {
    setSavedIds([]);
    toast.info("Cleared all saved schemes");
    void clearAllSavedSchemesInDb(userMobile);
  };

  const toggleSaved = (id: string) => {
    setSavedIds((v) => {
      const removing = v.includes(id);
      const next = removing ? v.filter((x) => x !== id) : [...v, id];
      toast.success(removing ? "Removed from saved schemes" : "Scheme saved");
      // Background sync to Supabase
      void toggleSavedSchemeInDb(userMobile, id, !removing);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((v) => (v === "light" ? "dark" : "light")),
      language,
      setLanguage: (lang: Language) => {
        setLanguage(lang);
        if (isAuthenticated) {
          void upsertFarmerProfileInDb(profile, userMobile, lang);
        }
      },
      savedIds,
      toggleSaved,
      saveAllSchemes,
      clearAllSaved,
      notifications,
      markRead: (id?: string) =>
        setNotifications((v) => v.map((n) => (!id || n.id === id ? { ...n, read: true } : n))),
      profile,
      updateProfile,
      sidebarOpen,
      setSidebarOpen,
      isAuthenticated,
      userMobile,
      login,
      logout,
    }),
    [
      theme,
      language,
      savedIds,
      notifications,
      profile,
      sidebarOpen,
      isAuthenticated,
      userMobile,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
