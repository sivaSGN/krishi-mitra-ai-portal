import { supabase } from "@/lib/supabase";
import type { FarmerProfile } from "@/types/app";

export interface DbFarmerProfile {
  id?: string;
  mobile: string;
  name: string;
  age: number;
  gender: string;
  state: string;
  district: string;
  farmer_type: string;
  crop: string;
  experience: string;
  irrigation: string;
  ownership: string;
  land_size: string;
  land_location: string;
  income: string;
  aadhaar: boolean;
  bank: boolean;
  land_document: boolean;
  preferred_language: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8000";

export async function upsertFarmerProfileInDb(
  profile: FarmerProfile,
  mobile: string = "9876543210",
  language: string = "en",
) {
  const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
  const payload = {
    mobile: cleanMobile || mobile,
    name: profile.name,
    age: parseInt(profile.age, 10) || 0,
    gender: profile.gender || "",
    state: profile.state || "",
    district: profile.district || "",
    farmer_type: profile.farmerType || "",
    farmerType: profile.farmerType || "",
    crop: profile.crop || "",
    experience: profile.experience || "",
    irrigation: profile.irrigation || "",
    ownership: profile.ownership || "",
    land_size: profile.landSize || "",
    landSize: profile.landSize || "",
    land_location: profile.landLocation || "",
    landLocation: profile.landLocation || "",
    income: profile.income || "",
    annual_income: profile.income || "",
    aadhaar: Boolean(profile.aadhaar),
    bank: Boolean(profile.bank),
    land_document: Boolean(profile.landDocument),
    landDocument: Boolean(profile.landDocument),
    preferred_language: language,
    updated_at: new Date().toISOString(),
  };

  // 1. Persist directly to local FastAPI SQLite database
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/${cleanMobile}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log(`Farmer profile for ${cleanMobile} saved to SQLite database successfully.`);
    }
  } catch (err) {
    console.warn("Local SQLite backend sync notice:", err);
  }

  // 2. Also sync to cloud Supabase if reachable
  try {
    const { data, error } = await supabase
      .from("farmer_profiles")
      .upsert(payload, { onConflict: "mobile" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase upsert farmer profile notice:", error.message);
      return { success: true, data: payload };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.warn("Supabase profile save notice:", err);
    return { success: true, data: payload };
  }
}

export async function getFarmerProfileFromDb(mobile: string) {
  if (!mobile) return null;
  const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
  if (!cleanMobile) return null;

  // 1. Try local SQLite database first
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/${cleanMobile}/profile`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.profile) {
        const d = json.profile;
        const profile: FarmerProfile = {
          name: d.name || "",
          age: d.age ? String(d.age) : "",
          gender: d.gender || "",
          state: d.state || "",
          district: d.district || "",
          farmerType: d.farmer_type || d.farmerType || "",
          crop: d.crop || "",
          experience: d.experience || "",
          irrigation: d.irrigation || "",
          ownership: d.ownership || "",
          landSize: d.land_size || d.landSize || "",
          landLocation: d.land_location || d.landLocation || "",
          income: d.income || d.annual_income || "",
          aadhaar: Boolean(d.aadhaar),
          bank: Boolean(d.bank),
          landDocument: Boolean(d.land_document ?? d.landDocument),
        };
        return { profile, language: d.preferred_language || "en", id: String(d.id || "") };
      }
    }
  } catch (err) {
    console.warn("Local backend fetch profile notice:", err);
  }

  // 2. Fallback to Supabase cloud
  try {
    const { data, error } = await supabase
      .from("farmer_profiles")
      .select("*")
      .eq("mobile", cleanMobile)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const profile: FarmerProfile = {
      name: data.name || "",
      age: data.age ? String(data.age) : "",
      gender: data.gender || "",
      state: data.state || "",
      district: data.district || "",
      farmerType: data.farmer_type || "",
      crop: data.crop || "",
      experience: data.experience || "",
      irrigation: data.irrigation || "",
      ownership: data.ownership || "",
      landSize: data.land_size || "",
      landLocation: data.land_location || "",
      income: data.income || data.annual_income || "",
      aadhaar: Boolean(data.aadhaar),
      bank: Boolean(data.bank),
      landDocument: Boolean(data.land_document),
    };

    return { profile, language: data.preferred_language || "en", id: data.id };
  } catch (err) {
    console.error("Error fetching farmer profile from Supabase:", err);
    return null;
  }
}

/**
 * Retrieves all stored farmer profiles from the database for future analytics.
 */
export async function getAllFarmersForAnalysisFromDb() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analytics/farmers`);
    if (res.ok) {
      const data = await res.json();
      return data.farmers || [];
    }
  } catch (err) {
    console.warn("Error fetching farmers analytics:", err);
  }
  return [];
}

/**
 * Returns direct URL to export farmer profile database records as CSV.
 */
export function getFarmersCsvExportUrl(): string {
  return `${API_BASE_URL}/api/analytics/export.csv`;
}

export async function toggleSavedSchemeInDb(farmerMobile: string, schemeId: string, isSaving: boolean) {
  if (!farmerMobile) return { success: false };
  try {
    // Get farmer ID — only operate if farmer already has a cloud profile
    const { data: farmer } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("mobile", farmerMobile)
      .maybeSingle();

    if (!farmer?.id) return { success: false };

    if (isSaving) {
      const { error } = await supabase
        .from("saved_schemes")
        .upsert({ farmer_id: farmer.id, scheme_id: schemeId }, { onConflict: "farmer_id,scheme_id" });
      if (error) console.warn("Supabase save scheme error:", error.message);
      return { success: !error };
    } else {
      const { error } = await supabase
        .from("saved_schemes")
        .delete()
        .eq("farmer_id", farmer.id)
        .eq("scheme_id", schemeId);
      if (error) console.warn("Supabase remove scheme error:", error.message);
      return { success: !error };
    }
  } catch (err) {
    console.error("Error toggling saved scheme in Supabase:", err);
    return { success: false };
  }
}

export async function bulkSaveSchemesInDb(farmerMobile: string, schemeIds: string[]) {
  if (!farmerMobile || !schemeIds.length) return { success: false };
  try {
    const { data: farmer } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("mobile", farmerMobile)
      .maybeSingle();

    if (!farmer?.id) return { success: false };

    const records = schemeIds.map((id) => ({
      farmer_id: farmer!.id,
      scheme_id: id,
    }));

    const { error } = await supabase
      .from("saved_schemes")
      .upsert(records, { onConflict: "farmer_id,scheme_id" });

    if (error) {
      console.warn("Supabase bulk save error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Error bulk saving schemes in Supabase:", err);
    return { success: false };
  }
}

export async function clearAllSavedSchemesInDb(farmerMobile: string) {
  try {
    const { data: farmer } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("mobile", farmerMobile)
      .maybeSingle();

    if (!farmer?.id) return { success: false };

    const { error } = await supabase
      .from("saved_schemes")
      .delete()
      .eq("farmer_id", farmer.id);

    return { success: !error };
  } catch (err) {
    console.error("Error clearing saved schemes:", err);
    return { success: false };
  }
}

export async function getSavedSchemesFromDb(farmerMobile: string): Promise<string[] | null> {
  try {
    const { data: farmer } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("mobile", farmerMobile)
      .maybeSingle();

    if (!farmer?.id) return null;

    const { data, error } = await supabase
      .from("saved_schemes")
      .select("scheme_id")
      .eq("farmer_id", farmer.id);

    if (error || !data) return null;
    return data.map((x) => x.scheme_id);
  } catch (err) {
    console.error("Error fetching saved schemes from Supabase:", err);
    return null;
  }
}

export async function recordEligibilityCheckInDb(
  farmerMobile: string,
  schemeId: string,
  status: string,
  matchScore: number,
  reason: string,
) {
  try {
    const { data: farmer } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("mobile", farmerMobile)
      .maybeSingle();

    const payload = {
      farmer_id: farmer?.id ?? null,
      scheme_id: schemeId,
      status,
      match_score: matchScore,
      reason,
    };

    const { error } = await supabase.from("eligibility_checks").insert(payload);
    if (error) console.warn("Supabase record eligibility check error:", error.message);
    return { success: !error };
  } catch (err) {
    console.error("Error saving eligibility check to Supabase:", err);
    return { success: false };
  }
}

export async function syncAllSchemesToSupabase() {
  try {
    const rawData = await import("@/data/raw-schemes.json");
    const items = rawData.default || rawData;

    const { error } = await supabase
      .from("schemes")
      .upsert(
        items.map((x: {
          scheme_id: number;
          scheme_name: string;
          ministry_department: string;
          category: string;
          launch_year: number | string;
          objective: string;
          target_beneficiaries: string;
          benefits: string;
          state: string;
          eligibility: string;
          documents_required: string;
          official_resource: string;
        }) => ({
          scheme_id: x.scheme_id,
          scheme_name: x.scheme_name,
          ministry_department: x.ministry_department,
          category: x.category,
          launch_year: String(x.launch_year || ""),
          objective: x.objective,
          target_beneficiaries: x.target_beneficiaries,
          benefits: x.benefits,
          state: x.state,
          eligibility: x.eligibility,
          documents_required: x.documents_required,
          official_resource: x.official_resource,
        })),
        { onConflict: "scheme_id" },
      );

    if (error) {
      console.warn("Supabase schemes sync notice:", error.message);
      return { success: false, error: error.message };
    }
    return { success: true, count: items.length };
  } catch (err) {
    console.error("Error syncing schemes to Supabase:", err);
    return { success: false };
  }
}

