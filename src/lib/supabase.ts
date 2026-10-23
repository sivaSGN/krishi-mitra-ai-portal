import { createClient } from "@supabase/supabase-js";

const rawUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ||
  "https://gpsyjpwnlnswspqewurs.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwc3lqcHdubG5zd3NwcWV3dXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2Mzg3MTMsImV4cCI6MjEwODIxNDcxM30.7k0x4_IAelVoD2SFpK8kaoBmzQ5obvAgWTxbtcw2fqw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
