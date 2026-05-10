import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import { UserProfile } from './types';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (supabaseUser: User) => {
    try {
      // 1. Optimized Path: Most users will have a profile linked to their UID.
      // Fetching by ID is the fastest possible index look-up.
      const { data: idData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();
      
      if (idData) {
        setProfile(mapProfile(idData));
        return;
      }

      // 2. Secondary Path: Check by email if ID not found (New login for existing record)
      const { data: emailData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', supabaseUser.email)
        .maybeSingle();
      
      if (emailData) {
        // Link and return
        const { data: linkedData, error: linkError } = await supabase
          .from('profiles')
          .update({ id: supabaseUser.id })
          .eq('email', supabaseUser.email)
          .select()
          .single();
        
        if (linkError) throw linkError;
        setProfile(mapProfile(linkedData));
        return;
      }

      // 3. Fallback: Create new profile
      const isMaudy = supabaseUser.email === 'maudy@lazuardi.sch.id';
      const newProfile = {
        id: supabaseUser.id,
        name: isMaudy ? "Maudy Larasati.,S.Psi." : (supabaseUser.user_metadata.full_name || 'User'),
        email: supabaseUser.email || '',
        role: isMaudy ? 'admin' : 'employee',
        photo_url: supabaseUser.user_metadata.avatar_url || '',
        niy: isMaudy ? "10.25.818" : "",
        nik: isMaudy ? "3276105508020001" : "",
        unit: isMaudy ? "Lazuardi" : "",
        position: isMaudy ? "Staf HRD" : "",
        contract_status: "Full Time",
        entry_date: isMaudy ? "2025-01-06" : null,
        gender: isMaudy ? "Pr." : "",
        birth_place: isMaudy ? "Jakarta" : "",
        birth_date: isMaudy ? "2002-08-15" : null,
        education: "S1 Psikologi - Universitas Gunadarma",
        phone: isMaudy ? "081218496052" : "",
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (insertError) throw insertError;
      setProfile(mapProfile(insertedData));
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      // If table doesn't exist or other DB error, we still want to show something or allow retry
      if (error.code === '42P01') {
        console.error('Tabel "profiles" belum dibuat di database Supabase Anda.');
      }
    } finally {
      // Logic for finalizing loading should be outside or handled with a flag
      setLoading(false);
    }
  };

  // Helper to map DB snake_case to Frontend camelCase
  const mapProfile = (dbData: any): UserProfile => ({
    userId: dbData.id,
    niy: dbData.niy,
    name: dbData.name,
    nik: dbData.nik,
    bpjs: dbData.bpjs,
    email: dbData.email,
    npwp: dbData.npwp,
    unit: dbData.unit,
    position: dbData.position,
    contractStatus: dbData.contract_status,
    entryDate: dbData.entry_date,
    gender: dbData.gender,
    birthPlace: dbData.birth_place,
    birthDate: dbData.birth_date,
    educationLevel: dbData.education_level,
    education: dbData.education,
    address: dbData.address,
    phone: dbData.phone,
    maritalStatus: dbData.marital_status,
    role: dbData.role,
    photoUrl: dbData.photo_url,
    idpLink: dbData.idp_link,
    emergencyContact: dbData.emergency_contact,
    careerHistory: dbData.career_history,
    cutiData: dbData.cuti_data,
    longServiceLeave: dbData.long_service_leave,
    createdAt: dbData.created_at
  });

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <div className="text-center">
          <p className="font-bold text-slate-800 tracking-tight text-lg">Memuat Profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {user && profile ? (
        <Dashboard user={user} profile={profile} />
      ) : (
        <Login />
      )}
    </div>
  );
}
