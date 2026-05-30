import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
        setLoading(true);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            setProfile(userSnap.data() as UserProfile);
          } else {
            // Create user document if it does not exist
            const newUser: UserProfile = {
              userId: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              role: (firebaseUser.email === 'maudy@lazuardi.sch.id' || firebaseUser.email === 'hrd@lazuardi.sch.id') ? 'admin' : 'employee',
              photoUrl: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              niy: '',
              nik: '',
              unit: 'Lazuardi',
              position: 'Staf',
              contractStatus: 'Full Time',
              entryDate: new Date().toISOString().split('T')[0],
              gender: '',
              birthPlace: '',
              birthDate: '',
              education: '',
              phone: '',
            };
            await setDoc(userDocRef, newUser);
            setProfile(newUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback to minimal profile if Firestore fails (likely rules)
          setProfile({
            userId: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: 'employee',
            photoUrl: firebaseUser.photoURL || '',
            createdAt: new Date().toISOString(),
          } as UserProfile);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
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
