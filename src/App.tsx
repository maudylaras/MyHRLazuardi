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
  const [debugError, setDebugError] = useState<string | null>(null);

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
        setDebugError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (supabaseUser: User) => {
    if (!supabaseUser) return;
    setDebugError(null);
    try {
      const userEmail = supabaseUser.email?.toLowerCase().trim();

      // 1. Jalur Utama: Cari berdasarkan ID Supabase
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

      // 2. Jalur Kedua: Cari berdasarkan Email (untuk data impor)
      if (userEmail) {
        const { data: emailData, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail);
        
        if (emailError) throw emailError;
        
        if (emailData && emailData.length > 0) {
          const targetRecord = emailData[0];

          // SAMBUNGKAN: Update profil lama dengan ID baru
          const { data: linkedData, error: linkError } = await supabase
            .from('profiles')
            .update({ id: supabaseUser.id })
            .eq('email', userEmail)
            .select()
            .maybeSingle();
          
          if (linkError) {
            setProfile(mapProfile(targetRecord));
          } else if (linkedData) {
            setProfile(mapProfile(linkedData));
          } else {
            setProfile(mapProfile(targetRecord));
          }
          return;
        }
      }

      // 3. Fallback: Buat profil baru
      const isMaudy = userEmail === 'maudy@lazuardi.sch.id';
      const newProfile = {
        id: supabaseUser.id,
        name: isMaudy ? "Maudy Larasati.,S.Psi." : (supabaseUser.user_metadata.full_name || 'User Baru'),
        email: userEmail || '',
        role: isMaudy ? 'admin' : 'employee',
        photo_url: supabaseUser.user_metadata.avatar_url || '',
        niy: isMaudy ? "10.25.818" : "",
        nik: isMaudy ? "3276105508020001" : "",
        unit: isMaudy ? "Lazuardi" : "",
        position: isMaudy ? "Staf HRD" : "",
        contract_status: "Full Time",
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .maybeSingle();

      if (insertError) {
        setDebugError(`Gagal membuat profil: ${insertError.message}`);
      } else if (insertedData) {
        setProfile(mapProfile(insertedData));
      }
    } catch (error: any) {
      setDebugError(error.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };


  // Helper to map DB snake_case to Frontend camelCase
  const mapProfile = (dbData: any): UserProfile => {
    if (!dbData) return {} as UserProfile;
    return {
      userId: dbData.id || '',
      niy: dbData.niy || '',
      name: dbData.name || '',
      nik: dbData.nik || '',
      bpjs: dbData.bpjs || '',
      email: dbData.email || '',
      npwp: dbData.npwp || '',
      unit: dbData.unit || '',
      position: dbData.position || '',
      contractStatus: dbData.contract_status || '',
      entryDate: dbData.entry_date || '',
      gender: dbData.gender || '',
      birthPlace: dbData.birth_place || '',
      birthDate: dbData.birth_date || '',
      educationLevel: dbData.education_level || '',
      education: dbData.education || '',
      address: dbData.address || '',
      phone: dbData.phone || '',
      maritalStatus: dbData.marital_status || '',
      role: dbData.role || 'employee',
      photoUrl: dbData.photo_url || '',
      idpLink: dbData.idp_link || '',
      emergencyContact: dbData.emergency_contact || '',
      careerHistory: dbData.career_history || [],
      cutiData: dbData.cuti_data || {},
      longServiceLeave: dbData.long_service_leave || {},
      createdAt: dbData.created_at || ''
    };
  };

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
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Perlu Sinkronisasi Data</h2>
              <p className="mt-2 text-slate-500 font-medium text-sm">Akun berhasil masuk, tapi data karyawan belum tersambung.</p>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-xl text-left space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Login Anda:</p>
                <p className="text-sm font-bold text-slate-700">{user.email}</p>
              </div>
              
              {debugError && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Status Database:</p>
                  <p className="text-[10px] font-medium text-red-600 bg-red-50 p-2 rounded mt-1">{debugError}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2">Solusi Perbaikan (Jalankan di SQL Editor):</p>
                <div className="space-y-2">
                  <p className="text-[9px] text-slate-500 leading-tight">1. Matikan keamanan (Row Level Security):</p>
                  <code className="block text-[9px] bg-slate-900 text-green-400 p-2 rounded font-mono">
                    ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
                  </code>
                  <p className="text-[9px] text-slate-500 leading-tight">2. Hapus batasan ID (Wajib jika impor via CSV):</p>
                  <code className="block text-[9px] bg-slate-900 text-green-400 p-2 rounded font-mono">
                    ALTER TABLE profiles ALTER COLUMN id DROP NOT NULL;
                  </code>
                  <p className="text-[9px] font-bold text-slate-600">3. Pastikan email di database sama persis dengan email login di atas.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Refresh Halaman
              </button>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="w-full py-3 text-slate-500 font-bold hover:text-slate-700 transition-all text-sm"
              >
                Keluar Aplikasi
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
