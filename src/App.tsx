import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';
import { UserProfile } from './types';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Loader2, ShieldCheck } from 'lucide-react';

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
      const { data: idData, error: idError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();
      
      if (idError) throw idError;

      if (idData) {
        setProfile(mapProfile(idData));
        return;
      }

      // 2. Secondary Path: Check by email if ID not found (New login for existing record)
      const { data: emailData, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', supabaseUser.email)
        .maybeSingle();
      
      if (emailError) throw emailError;
      
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
          <p className="text-xs text-slate-400 font-medium">Ini biasanya memakan waktu beberapa detik</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!user) return <Login />;
    
    if (!profile) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full rounded-3xl bg-white p-8 shadow-xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-50 text-red-600 flex items-center justify-center rounded-2xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Profil Tidak Ditemukan</h2>
              <p className="mt-2 text-slate-500 font-medium">Akun Anda ({user.email}) berhasil masuk, tetapi kami tidak dapat memuat data karyawan Anda.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Penyebab Kemungkinan:</p>
              <ul className="text-xs text-slate-600 space-y-1 font-medium list-disc ml-4">
                <li>Tabel "profiles" belum dibuat di Supabase SQL Editor.</li>
                <li>RLS (Row Level Security) memblokir akses baca/tulis.</li>
                <li>Struktur kolom tabel tidak sesuai dengan aplikasi.</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Coba Muat Ulang
              </button>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="w-full py-3 text-slate-500 font-bold hover:text-slate-700 transition-all"
              >
                Kemuar & Ganti Akun
              </button>
            </div>
          </div>
        </div>
      );
    }

    return <Dashboard user={user} profile={profile} />;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {renderContent()}
    </div>
  );
}
