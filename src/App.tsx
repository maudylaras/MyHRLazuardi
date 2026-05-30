import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Loader2 } from 'lucide-react';
import { ALL_EMPLOYEES } from './data/employees';

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
          const email = firebaseUser.email || '';
          const emailLower = email.toLowerCase().trim();
          const uid = firebaseUser.uid;
          
          const userDocRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userDocRef);
          
          let activeProfile: UserProfile | null = null;
          
          if (userSnap.exists()) {
            const existingData = userSnap.data() as UserProfile;
            
            // Only update fields without deleting or overwriting filled fields.
            const updatedProfile = {
              ...existingData,
              authUid: uid,
              email: existingData.email || email,
              emailLower: emailLower,
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            await setDoc(userDocRef, {
              authUid: uid,
              emailLower: emailLower,
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
            
            activeProfile = updatedProfile;
          } else {
            // users/{uid} does NOT exist yet. Search for a prepared profile to link first.
            let matchedProfileDocId: string | null = null;
            let matchedProfileData: any = null;
            
            // Try 1: Search in emailIndex first
            try {
              const emailIndexRef = doc(db, 'emailIndex', emailLower);
              const emailIndexSnap = await getDoc(emailIndexRef);
              if (emailIndexSnap.exists()) {
                const indexData = emailIndexSnap.data();
                const targetDocId = indexData.linkedUserDocId || indexData.uid;
                if (targetDocId) {
                  const matchedRef = doc(db, 'users', targetDocId);
                  const matchedSnap = await getDoc(matchedRef);
                  if (matchedSnap.exists()) {
                    matchedProfileDocId = targetDocId;
                    matchedProfileData = matchedSnap.data();
                  }
                }
              }
            } catch (err) {
              console.warn("Could not read from emailIndex:", err);
            }
            
            // Try 2: Find static definition in ALL_EMPLOYEES and try direct point reads on Firestore
            const matchedStatic = ALL_EMPLOYEES.find(e => {
              const staticEmail = e.email ? e.email.toLowerCase().trim() : '';
              return staticEmail === emailLower;
            });
            
            if (!matchedProfileDocId && matchedStatic) {
              const candidateIds = [matchedStatic.userId, `mock_${matchedStatic.userId}`];
              for (const candidateId of candidateIds) {
                try {
                  const candidateRef = doc(db, 'users', candidateId);
                  const candidateSnap = await getDoc(candidateRef);
                  if (candidateSnap.exists()) {
                    matchedProfileDocId = candidateId;
                    matchedProfileData = candidateSnap.data();
                    break;
                  }
                } catch (err) {
                  console.warn(`Could not read candidate profile ${candidateId}:`, err);
                }
              }
            }
            
            // Try 3: Fallback database query match
            if (!matchedProfileDocId) {
              try {
                const { query, collection, where, getDocs, limit } = await import('firebase/firestore');
                const q1 = query(collection(db, 'users'), where('emailLower', '==', emailLower), limit(1));
                const snap1 = await getDocs(q1);
                if (!snap1.empty) {
                  matchedProfileDocId = snap1.docs[0].id;
                  matchedProfileData = snap1.docs[0].data();
                } else {
                  const q2 = query(collection(db, 'users'), where('email', '==', email), limit(1));
                  const snap2 = await getDocs(q2);
                  if (!snap2.empty) {
                    matchedProfileDocId = snap2.docs[0].id;
                    matchedProfileData = snap2.docs[0].data();
                  }
                }
              } catch (err) {
                console.warn("Query fallback failed:", err);
              }
            }
            
            // If we found a prepared profile to link:
            if (matchedProfileDocId && matchedProfileData) {
              const mergedProfile: UserProfile = {
                ...matchedProfileData,
                userId: uid,
                authUid: uid,
                email: matchedProfileData.email || email,
                emailLower: emailLower,
                name: matchedProfileData.name || firebaseUser.displayName || 'User',
                photoUrl: matchedProfileData.photoUrl || firebaseUser.photoURL || '',
                originalProfileId: matchedProfileDocId,
                linkedAt: new Date().toISOString(),
                createdAt: matchedProfileData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              };
              
              await setDoc(userDocRef, mergedProfile, { merge: true });
              activeProfile = mergedProfile;
              
              // Seed the emailIndex for future instant point reads
              try {
                await setDoc(doc(db, 'emailIndex', emailLower), {
                  uid: uid,
                  email: email,
                  emailLower: emailLower,
                  linkedUserDocId: uid,
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              } catch (err) {
                console.warn("Could not save emailIndex:", err);
              }
            } else if (matchedStatic) {
              // We matched static info, but it hasn't been seeded in Firestore yet.
              const mergedProfile: UserProfile = {
                ...matchedStatic,
                userId: uid,
                authUid: uid,
                email: matchedStatic.email || email,
                emailLower: emailLower,
                name: matchedStatic.name || firebaseUser.displayName || 'User',
                photoUrl: matchedStatic.photoUrl || firebaseUser.photoURL || '',
                linkedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString()
              };
              
              await setDoc(userDocRef, mergedProfile, { merge: true });
              activeProfile = mergedProfile;
              
              try {
                await setDoc(doc(db, 'emailIndex', emailLower), {
                  uid: uid,
                  email: email,
                  emailLower: emailLower,
                  linkedUserDocId: uid,
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              } catch (err) {
                console.warn("Failed saving emailIndex in static fallback:", err);
              }
            } else {
              // No matching employee profile exists. Create a minimal new profile.
              const newUser: UserProfile = {
                userId: uid,
                name: firebaseUser.displayName || 'User',
                email: email,
                emailLower: emailLower,
                role: (email === 'maudy@lazuardi.sch.id' || email === 'hrd@lazuardi.sch.id') ? 'admin' : 'employee',
                photoUrl: firebaseUser.photoURL || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                authUid: uid,
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
              activeProfile = newUser;
              
              try {
                await setDoc(doc(db, 'emailIndex', emailLower), {
                  uid: uid,
                  email: email,
                  emailLower: emailLower,
                  linkedUserDocId: uid,
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              } catch (err) {
                console.warn("Failed saving emailIndex in blank profile creation:", err);
              }
            }
          }
          
          setProfile(activeProfile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile({
            userId: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            role: (firebaseUser.email === 'maudy@lazuardi.sch.id' || firebaseUser.email === 'hrd@lazuardi.sch.id') ? 'admin' : 'employee',
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
