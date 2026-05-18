import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from './types';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        setAuthError(null); 
        setLoading(true);
        try {
          const loginEmail = (firebaseUser.email || '').toLowerCase().trim();
          
          // 1. Check if document users/{currentUser.uid} already exists
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            // Already linked or UID-based profile
            setProfile({ userId: userSnap.id, ...userSnap.data() } as UserProfile);
          } else {
            // 2. If it does not exist, look for an old profile by normalized email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', loginEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              // Found old profile
              const oldProfileDoc = querySnapshot.docs[0];
              const oldProfileData = oldProfileDoc.data();
              const oldProfileId = oldProfileDoc.id;

              // 3. Create new document users/{currentUser.uid} copying all data
              // We strictly preserve all existing fields, especially role
              const newUser: any = {
                ...oldProfileData,
                userId: firebaseUser.uid,
                authUid: firebaseUser.uid,
                email: loginEmail,
                linkedProfileId: oldProfileId,
                profileLinkedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                isLinkedProfile: true
              };

              await setDoc(userDocRef, newUser, { merge: true });
              
              setProfile(newUser as UserProfile);
            } else {
              // 4. No profile found by email - Access Denied
              setAuthError("Your account is not registered. Please contact HR Admin.");
              await auth.signOut();
              setUser(null);
              setProfile(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setAuthError("Terjadi kesalahan saat memproses akun. Silakan hubungi admin.");
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
        // Do NOT clear authError here, let it persist for Login component
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
        <Login onLogin={signInWithGoogle} externalError={authError} />
      )}
    </div>
  );
}
