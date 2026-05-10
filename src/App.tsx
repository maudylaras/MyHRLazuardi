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
    // Check active sessions and subscribe to auth changes
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (supabaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
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
      } else if (data) {
        setProfile(mapProfile(data));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
