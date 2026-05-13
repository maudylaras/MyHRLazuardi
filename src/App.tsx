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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Authenticate only - Bypass Firestore storage/retrieval as per requirements
        const isMaudy = firebaseUser.email === 'maudy@lazuardi.sch.id';
        
        const currentProfile: UserProfile = {
          userId: firebaseUser.uid,
          name: firebaseUser.displayName || (isMaudy ? "Maudy Larasati.,S.Psi." : 'User'),
          email: firebaseUser.email || '',
          role: isMaudy ? 'admin' : 'employee',
          photoUrl: firebaseUser.photoURL || '',
          createdAt: new Date().toISOString(),
          niy: isMaudy ? "10.25.818" : "",
          nik: isMaudy ? "3276105508020001" : "",
          unit: "Lazuardi",
          position: isMaudy ? "Staf HRD" : "Staf",
          contractStatus: "Full Time",
          entryDate: isMaudy ? "06-Jan-25" : "01-Jan-26",
          gender: isMaudy ? "Pr." : "",
          birthPlace: "Jakarta",
          birthDate: "15 August 2002",
          education: "S1 Psikologi",
          phone: "081218496052",
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
