import { createClient } from "@supabase/supabase-js";

// ==========================================================
// PASTE YOUR SUPABASE CREDENTIALS HERE
// 1. SUPABASE_URL: Your Project URL
// 2. SUPABASE_PUBLIC_KEY: Your Project Public (anon) API Key
// ==========================================================
const SUPABASE_URL = "https://tztojvbesdxzrdoparnw.supabase.co";
const SUPABASE_PUBLIC_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dG9qdmJlc2R4enJkb3Bhcm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDI1NTEsImV4cCI6MjA5Mzk3ODU1MX0._GqLZgsx7_cMplU96pHOz566r_Y6n3SfrpIcvBUj9NI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
