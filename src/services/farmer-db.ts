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

export async function upsertFarmerProfileInDb(
  profile: FarmerProfile,
  mobile: string = "9876543210",
  language: string = "en",
) {
  try {
    const payload = {
      mobile,
      name: profile.name,
      age: parseInt(profile.age, 10) || 42,
      gender: profile.gender || "Male",
      state: profile.state || "Telangana",
      district: profile.district || "Warangal",
      farmer_type: profile.farmerType || "Small Farmer",
      crop: profile.crop || "Paddy & Cotton",
      experience: profile.experience || "18 years",
      irrigation: profile.irrigation || "Borewell",
      ownership: profile.ownership || "Owned",
      land_size: profile.landSize || "3.5 acres",
      land_location: profile.landLocation || "Warangal Rural",
      income: profile.income || "₹1,80,000",
      aadhaar: Boolean(profile.aadhaar),
      bank: Boolean(profile.bank),
      land_document: Boolean(profile.landDocument),
      preferred_language: language,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("farmer_profiles")
      .upsert(payload, { onConflict: "mobile" })
      .select()
      .single();

    if (error) {
      console.warn("Supabase upsert farmer profile error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    console.error("Error saving farmer profile to Supabase:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getFarmerProfileFromDb(mobile: string = "9876543210") {
  try {
    const { data, error } = await supabase
      .from("farmer_profiles")
      .select("*")
      .eq("mobile", mobile)
      .maybeSingle();

    if (error) {
      console.warn("Supabase fetch profile error:", error.message);
      return null;
    }

    if (!data) return null;

    const profile: FarmerProfile = {
      name: data.name,
      age: String(data.age),
      gender: data.gender,
      state: data.state,
      district: data.district,
      farmerType: data.farmer_type,
      crop: data.crop,
      experience: data.experience,
      irrigation: data.irrigation,
      ownership: data.ownership,
      landSize: data.land_size,
      landLocation: data.land_location,
      income: data.income,
      aadhaar: data.aadhaar,
      bank: data.bank,
      landDocument: data.land_document,
    };

    return { profile, language: data.preferred_language, id: data.id };
  } catch (err) {
    console.error("Error fetching farmer profile from Supabase:", err);
    return null;
  }
}

export async function toggleSavedSchemeInDb(farmerMobile: string, schemeId: string, isSaving: boolean) {
  try {
    // 1. Get farmer ID
    let { data: farmer } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("mobile", farmerMobile)
      .maybeSingle();

    if (!farmer?.id) {
      // Auto-create farmer if not found
      const createRes = await upsertFarmerProfileInDb(
        {
          name: "Farmer",
          age: "42",
          gender: "Male",
          state: "Telangana",
          district: "Warangal",
          farmerType: "Small Farmer",
          crop: "Paddy & Cotton",
          experience: "15 years",
          irrigation: "Borewell",
          ownership: "Owned",
          landSize: "3.5 acres",
          landLocation: "Warangal Rural",
          income: "₹1,80,000",
          aadhaar: true,
          bank: true,
          landDocument: true,
        },
        farmerMobile,
      );
      if (createRes?.data?.id) {
        farmer = { id: createRes.data.id };
      }
    }

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
  try {
    let { data: farmer } = await supabase
      .from("farmer_profiles")
      .select("id")
      .eq("mobile", farmerMobile)
      .maybeSingle();

    if (!farmer?.id) {
      const createRes = await upsertFarmerProfileInDb(
        {
          name: "Farmer",
          age: "42",
          gender: "Male",
          state: "Telangana",
          district: "Warangal",
          farmerType: "Small Farmer",
          crop: "Paddy & Cotton",
          experience: "15 years",
          irrigation: "Borewell",
          ownership: "Owned",
          landSize: "3.5 acres",
          landLocation: "Warangal Rural",
          income: "₹1,80,000",
          aadhaar: true,
          bank: true,
          landDocument: true,
        },
        farmerMobile,
      );
      if (createRes?.data?.id) {
        farmer = { id: createRes.data.id };
      }
    }

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

