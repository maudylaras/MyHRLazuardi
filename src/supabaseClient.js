import { createClient } from "@supabase/supabase-js";

// ==========================================
// PASTE YOUR SUPABASE CREDENTIALS BELOW
// 1. SUPABASE_URL: Your Supabase Project URL (e.g., https://xyz.supabase.co)
//    NOTE: Do not include "/rest/v1/" at the end.
// 2. SUPABASE_PUBLIC_KEY: Your Project API Key (anon/public)
// ==========================================
const SUPABASE_URL = "https://tztojvbesdxzrdoparnw.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_epA3zG3jjYV15nef8o_CrA_Wucs-phe";

// Robust cleaning of the URL
const cleanUrl = (url) => {
  if (!url) return "";
  let cleaned = url.trim();
  if (!cleaned.startsWith("http")) cleaned = `https://${cleaned}`;
  return cleaned.replace(/\/$/, "").replace(/\/rest\/v1$/, "");
};

export const supabase = createClient(cleanUrl(SUPABASE_URL), SUPABASE_PUBLIC_KEY);
