/**
 * =============================================================================
 * Krishi Mitra AI Portal - Authentication & Database Service (auth-service.ts)
 * =============================================================================
 * 
 * Provides secure user registration, credential validation, PBKDF2 password hashing,
 * unique mobile verification, and session management.
 * Integrates with the FastAPI backend (SQLite) and provides full client-side
 * database persistence (Web Crypto + Local Database) for 100% reliability.
 */

import type { Language } from "@/types/app";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id?: string | undefined;
  mobile: string;
  name: string;
  age: number;
  state: string;
  district: string;
  preferredLanguage: Language;
  annualIncome: string;
  createdAt?: string | undefined;
}

export interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
}

export interface RegisterPayload {
  name: string;
  age: number | string;
  state: string;
  district: string;
  preferredLanguage: string;
  annualIncome: string;
  mobile: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserProfile;
  token?: string;
}

const DB_KEY = "km_users_database";
const SESSION_KEY = "km_user_session";
const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8000";

// ---------------------------------------------------------------------------
// Cryptographic Password Hashing (PBKDF2-HMAC-SHA256 with 100,000 iterations)
// ---------------------------------------------------------------------------

/**
 * Hashes a password using the Web Crypto API PBKDF2 standard with 100,000 iterations.
 * Passwords are never saved in plain text.
 */
export async function hashPassword(password: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = existingSalt || Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hash = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { hash, salt };
}

/**
 * Verifies a password against the stored hash and salt.
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return hash === storedHash;
}

// ---------------------------------------------------------------------------
// Database Operations
// ---------------------------------------------------------------------------

/**
 * Reads all stored users from the persistent database.
 */
export function getLocalUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Writes the users array to persistent storage.
 */
function saveLocalUsers(users: StoredUser[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
  } catch (err) {
    console.error("Failed to save users database:", err);
  }
}

/**
 * Ensures the database is initialized with default demo credentials.
 */
export async function ensureDbInitialized(): Promise<void> {
  if (typeof window === "undefined") return;
  const users = getLocalUsers();
  const demoExists = users.some((u) => u.mobile === "9876543210");
  if (!demoExists) {
    const { hash, salt } = await hashPassword("farmer123");
    users.push({
      id: "demo-user-1",
      mobile: "9876543210",
      name: "Ramesh Kumar",
      age: 42,
      state: "Telangana",
      district: "Warangal",
      preferredLanguage: "en",
      annualIncome: "₹2,50,000",
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    });
    saveLocalUsers(users);
  }
}

// Initialize on load
if (typeof window !== "undefined") {
  void ensureDbInitialized();
}

/**
 * Normalizes a mobile number to 10 digits.
 */
export function normalizeMobile(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

// ---------------------------------------------------------------------------
// Registration & Sign-In Flows
// ---------------------------------------------------------------------------

/**
 * Registers a new user with their profile details and authentication credentials.
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthResult> {
  const cleanMobile = normalizeMobile(payload.mobile);

  // 1. Validate Mobile
  if (!cleanMobile || cleanMobile.length !== 10) {
    return {
      success: false,
      message: "Please enter a valid 10-digit mobile number.",
    };
  }

  // 2. Validate Password
  if (!payload.password || payload.password.length < 6) {
    return {
      success: false,
      message: "Password must be at least 6 characters long.",
    };
  }

  // 3. Validate Profile Details
  if (!payload.name?.trim()) {
    return { success: false, message: "Please enter your full name." };
  }
  const ageNum = parseInt(String(payload.age), 10);
  if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
    return { success: false, message: "Please enter a valid age between 18 and 120." };
  }
  if (!payload.state?.trim()) {
    return { success: false, message: "Please select your state." };
  }
  if (!payload.district?.trim()) {
    return { success: false, message: "Please enter your district." };
  }
  if (!payload.annualIncome?.trim()) {
    return { success: false, message: "Please enter your annual income." };
  }

  // 4. Try Backend API first if reachable
  try {
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: payload.name.trim(),
        age: ageNum,
        state: payload.state.trim(),
        district: payload.district.trim(),
        preferred_language: payload.preferredLanguage || "en",
        annual_income: payload.annualIncome.trim(),
        mobile: cleanMobile,
        password: payload.password,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const user: UserProfile = {
        mobile: cleanMobile,
        name: payload.name.trim(),
        age: ageNum,
        state: payload.state.trim(),
        district: payload.district.trim(),
        preferredLanguage: (payload.preferredLanguage as Language) || "en",
        annualIncome: payload.annualIncome.trim(),
        id: String(data.user?.id || Date.now()),
      };

      // Also save in local database store for offline persistence
      const { hash, salt } = await hashPassword(payload.password);
      const localUsers = getLocalUsers().filter((u) => u.mobile !== cleanMobile);
      localUsers.push({ ...user, passwordHash: hash, salt, createdAt: new Date().toISOString() });
      saveLocalUsers(localUsers);

      // Store in Supabase database
      await syncFarmerProfileToSupabase({
        mobile: cleanMobile,
        name: payload.name.trim(),
        age: ageNum,
        state: payload.state.trim(),
        district: payload.district.trim(),
        preferredLanguage: payload.preferredLanguage || "en",
        annualIncome: payload.annualIncome.trim(),
        passwordHash: hash,
        salt,
      });

      saveSession(user, data.session_token || "session-" + Date.now());

      return {
        success: true,
        message: "Account registered successfully!",
        user,
        token: data.session_token,
      };
    } else if (res.status === 400) {
      const errorData = await res.json();
      if (errorData.detail?.includes("already exists") || errorData.detail?.includes("already registered")) {
        return {
          success: false,
          message: "An account with this mobile number already exists. Please sign in instead.",
        };
      }
    }
  } catch {
    // Backend offline; proceed with robust local and Supabase registration
  }

  // 5. Local Database Registration
  const users = getLocalUsers();
  const existing = users.find((u) => u.mobile === cleanMobile);
  if (existing) {
    return {
      success: false,
      message: "An account with this mobile number already exists. Please sign in instead.",
    };
  }

  // Hash password securely (never plain text)
  const { hash, salt } = await hashPassword(payload.password);

  const newUser: StoredUser = {
    id: "user-" + Date.now(),
    mobile: cleanMobile,
    name: payload.name.trim(),
    age: ageNum,
    state: payload.state.trim(),
    district: payload.district.trim(),
    preferredLanguage: (payload.preferredLanguage as Language) || "en",
    annualIncome: payload.annualIncome.trim(),
    passwordHash: hash,
    salt,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveLocalUsers(users);

  // Store 6 farmer details + auth in Supabase database
  await syncFarmerProfileToSupabase({
    mobile: cleanMobile,
    name: payload.name.trim(),
    age: ageNum,
    state: payload.state.trim(),
    district: payload.district.trim(),
    preferredLanguage: payload.preferredLanguage || "en",
    annualIncome: payload.annualIncome.trim(),
    passwordHash: hash,
    salt,
  });

  const userProfile: UserProfile = {
    id: newUser.id,
    mobile: newUser.mobile,
    name: newUser.name,
    age: newUser.age,
    state: newUser.state,
    district: newUser.district,
    preferredLanguage: newUser.preferredLanguage,
    annualIncome: newUser.annualIncome,
    createdAt: newUser.createdAt,
  };

  saveSession(userProfile, "session-" + Date.now());

  return {
    success: true,
    message: "Registration successful! Welcome to Scheme Connect.",
    user: userProfile,
  };
}

/**
 * Syncs the farmer profile and credentials directly to Supabase 'farmer_profiles' table.
 */
export async function syncFarmerProfileToSupabase(record: {
  mobile: string;
  name: string;
  age: number;
  state: string;
  district: string;
  preferredLanguage?: string;
  annualIncome: string;
  passwordHash: string;
  salt: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("farmer_profiles")
      .upsert(
        {
          mobile: record.mobile,
          name: record.name,
          age: record.age,
          state: record.state,
          district: record.district,
          preferred_language: record.preferredLanguage || "en",
          annual_income: record.annualIncome,
          password_hash: record.passwordHash,
          salt: record.salt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "mobile" }
      );

    if (error) {
      console.warn("Supabase farmer_profiles sync notice:", error.message);
      return { success: false, error: error.message };
    }
    console.log("Farmer profile stored in Supabase database successfully!");
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn("Supabase network notice:", errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Validates mobile number and password against the database.
 */
export async function loginUser(mobile: string, password: string): Promise<AuthResult> {
  const cleanMobile = normalizeMobile(mobile);

  if (!cleanMobile || cleanMobile.length !== 10) {
    return {
      success: false,
      message: "Please enter a valid 10-digit registered mobile number.",
    };
  }

  if (!password) {
    return {
      success: false,
      message: "Please enter your password.",
    };
  }

  // 1. Try Backend API if online
  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: cleanMobile,
        password,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const user: UserProfile = {
        id: String(data.user?.id || ""),
        mobile: data.user?.mobile || cleanMobile,
        name: data.user?.name || "Farmer",
        age: data.user?.age || 42,
        state: data.user?.state || "Telangana",
        district: data.user?.district || "Warangal",
        preferredLanguage: data.user?.preferred_language || "en",
        annualIncome: data.user?.annual_income || "₹2,50,000",
      };

      saveSession(user, data.session_token || "session-" + Date.now());

      return {
        success: true,
        message: `Welcome back, ${user.name}!`,
        user,
        token: data.session_token,
      };
    } else if (res.status === 401) {
      const err = await res.json();
      return {
        success: false,
        message: err.detail || "Invalid mobile number or password.",
      };
    }
  } catch {
    // Backend offline; fallback to local database verification
  }

  // 2. Validate against Persistent Local Database
  await ensureDbInitialized();
  const users = getLocalUsers();
  let user = users.find((u) => u.mobile === cleanMobile);

  // 3. Fallback: Check Supabase cloud database if not in local storage
  if (!user) {
    try {
      const { data: sbUser, error: sbErr } = await supabase
        .from("farmer_profiles")
        .select("*")
        .eq("mobile", cleanMobile)
        .maybeSingle();

      if (!sbErr && sbUser && sbUser.password_hash && sbUser.salt) {
        user = {
          id: sbUser.id ? String(sbUser.id) : "sb-" + Date.now(),
          mobile: sbUser.mobile,
          name: sbUser.name,
          age: sbUser.age,
          state: sbUser.state,
          district: sbUser.district,
          preferredLanguage: (sbUser.preferred_language as Language) || "en",
          annualIncome: sbUser.annual_income,
          passwordHash: sbUser.password_hash,
          salt: sbUser.salt,
          createdAt: sbUser.created_at,
        };

        // Cache in local storage for offline speed
        const updatedUsers = users.filter((u) => u.mobile !== cleanMobile);
        updatedUsers.push(user);
        saveLocalUsers(updatedUsers);
      }
    } catch {
      // Supabase remote query failed, proceed to not found check
    }
  }

  if (!user) {
    return {
      success: false,
      message: "No account found with this mobile number. Please register first.",
    };
  }

  // Verify password hash against salt
  const isMatch = await verifyPassword(password, user.passwordHash, user.salt);
  if (!isMatch) {
    return {
      success: false,
      message: "Incorrect password. Please verify your credentials and try again.",
    };
  }

  const userProfile: UserProfile = {
    id: user.id,
    mobile: user.mobile,
    name: user.name,
    age: user.age,
    state: user.state,
    district: user.district,
    preferredLanguage: user.preferredLanguage,
    annualIncome: user.annualIncome,
    createdAt: user.createdAt,
  };

  saveSession(userProfile, "session-" + Date.now());

  return {
    success: true,
    message: `Welcome back, ${user.name}!`,
    user: userProfile,
  };
}

// ---------------------------------------------------------------------------
// Session Management
// ---------------------------------------------------------------------------

function saveSession(user: UserProfile, token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, timestamp: Date.now() }));
    localStorage.setItem("km-logged-in", "true");
    localStorage.setItem("km-auth", "true");
    localStorage.setItem("km-user-mobile", cleanDigits(user.mobile));
  } catch {
    // ignore
  }
}

export function getCurrentSession(): { user: UserProfile; token: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("km-logged-in");
    localStorage.setItem("km-auth", "false");
  } catch {
    // ignore
  }
}

function cleanDigits(val: string): string {
  return val.replace(/\D/g, "");
}
