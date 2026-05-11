import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from './types';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

import { seedEmployees } from './lib/seed';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch or create profile
        try {
          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          
          let currentProfile: UserProfile;

          if (profileSnap.exists()) {
            currentProfile = profileSnap.data() as UserProfile;
            // Force Maudy as admin
            if (firebaseUser.email === 'maudy@lazuardi.sch.id' && currentProfile.role !== 'admin') {
              currentProfile.role = 'admin';
              await updateDoc(profileRef, { role: 'admin' });
            }
          } else {
            // Seed logic for Maudy (the current user based on email)
            const isMaudy = firebaseUser.email === 'maudy@lazuardi.sch.id';
            
            currentProfile = {
              userId: firebaseUser.uid,
              name: isMaudy ? "Maudy Larasati.,S.Psi." : (firebaseUser.displayName || 'User'),
              email: firebaseUser.email || '',
              role: isMaudy ? 'admin' : 'employee', // Assign admin to requester for setup
              photoUrl: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              // Default spreadsheet data if Maudy
              niy: isMaudy ? "10.25.818" : "",
              nik: isMaudy ? "3276105508020001" : "",
              unit: isMaudy ? "Lazuardi" : "",
              position: isMaudy ? "Staf HRD" : "",
              contractStatus: "Full Time",
              entryDate: isMaudy ? "06-Jan-25" : "",
              gender: isMaudy ? "Pr." : "",
              birthPlace: isMaudy ? "Jakarta" : "",
              birthDate: isMaudy ? "15 August 2002" : "",
              education: "S1 Psikologi - Universitas Gunadarma",
              phone: isMaudy ? "081218496052" : "",
            };
            await setDoc(profileRef, currentProfile);
          }
          setProfile(currentProfile);

          // If admin, auto seed some data for the demo search
          if (currentProfile.role === 'admin') {
            seedEmployees().catch(console.error);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
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
