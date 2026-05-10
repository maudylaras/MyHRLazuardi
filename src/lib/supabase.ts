import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const env = (import.meta as any).env || {};
  
  const rawUrl = env.VITE_SUPABASE_URL;
  const rawKey = env.VITE_SUPABASE_ANON_KEY;

  const fallbackUrl = "https://tztojvbesdxzrdoparnw.supabase.co";
  const fallbackKey = "sb_publishable_epA3zG3jjYV15nef8o_CrA_Wucs-phe";

  const isValid = (val: any) => 
    typeof val === 'string' && 
    val.trim().length > 0 && 
    val !== 'undefined' && 
    val !== 'null';

  const sanitizeUrl = (url: any) => {
    if (!isValid(url)) return fallbackUrl;
    let cleaned = url.trim();
    if (!cleaned.startsWith('http')) {
      cleaned = `https://${cleaned}`;
    }
    // Remove trailing slash and any /rest/v1 suffix that users often copy by mistake
    return cleaned.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  };

  const supabaseUrl = sanitizeUrl(rawUrl);
  const supabaseAnonKey = isValid(rawKey) ? rawKey.trim() : fallbackKey;

  // Final validation before passing to createClient
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.error('CRITICAL: Invalid Supabase URL detected:', supabaseUrl);
    return { url: fallbackUrl, key: fallbackKey };
  }

  return { url: supabaseUrl, key: supabaseAnonKey };
};

const { url, key } = getSupabaseConfig();

export const supabase = createClient(url, key);
