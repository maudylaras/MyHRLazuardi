import { useState, useEffect } from 'react';
import { auth, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { UserProfile } from './types';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Create a minimal profile from auth data since we're not using Firestore yet
        const currentProfile: UserProfile = {
          userId: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          role: firebaseUser.email === 'maudy@lazuardi.sch.id' ? 'admin' : 'employee',
          photoUrl: firebaseUser.photoURL || '',
          createdAt: new Date().toISOString(),
          niy: "",
          nik: "",
          unit: "Lazuardi",
          position: "Karyawan",
          contractStatus: "Full Time",
          entryDate: "",
          gender: "",
          birthPlace: "",
          birthDate: "",
          education: "",
          phone: "",
        };
        setProfile(currentProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        <Login onLogin={signInWithGoogle} />
      )}
    </div>
  );
}
