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
        setAuthError(null); // Clear error on successful auth
        setLoading(true);
        try {
          // 1. Check if document users/{currentUser.uid} already exists
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            setProfile({ userId: userSnap.id, ...userSnap.data() } as UserProfile);
          } else {
            // 2. If it does not exist, look for an old profile by email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', firebaseUser.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              // Found old profile
              const oldProfileDoc = querySnapshot.docs[0];
              const oldProfileData = oldProfileDoc.data();
              const oldProfileId = oldProfileDoc.id;

              // 3. Create new document users/{currentUser.uid} copying all data
              const newUser: UserProfile = {
                ...(oldProfileData as UserProfile),
                userId: firebaseUser.uid,
                // Add/Update required fields
                authUid: firebaseUser.uid,
                email: firebaseUser.email || (oldProfileData.email as string),
                linkedProfileId: oldProfileId,
                profileLinkedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };

              await setDoc(userDocRef, newUser);
              
              setProfile(newUser);
            } else {
              // 4. No profile found by email
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
