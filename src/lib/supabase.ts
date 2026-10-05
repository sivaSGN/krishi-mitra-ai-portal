import { createClient } from "@supabase/supabase-js";

const rawUrl = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) || "https://rznqcucxgbkijisoivdz.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bnFjdWN4Z2JraWppc29pdmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMjY1NDIsImV4cCI6MjEwNjYwMjU0Mn0.TUZ9ZzcMMfdLQ1veAGuY-56I5dWr0cQsj-RimhURwqc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
