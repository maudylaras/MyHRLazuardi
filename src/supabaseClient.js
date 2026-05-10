import { createClient } from "@supabase/supabase-js";

// ==========================================================
// PASTE YOUR SUPABASE CREDENTIALS HERE
// 1. SUPABASE_URL: Your Project URL
// 2. SUPABASE_PUBLIC_KEY: Your Project Public (anon) API Key
// ==========================================================
const SUPABASE_URL = "https://tztojvbesdxzrdoparnw.supabase.co/rest/v1/";
const SUPABASE_PUBLIC_KEY = "sb_publishable_epA3zG3jjYV15nef8o_CrA_Wucs-phe";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
