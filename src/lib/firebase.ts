import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAk31R8g0A9xOf4VwQvdOEhCxpo58K6hfQ",
  authDomain: "myhrlazuardi.firebaseapp.com",
  projectId: "myhrlazuardi",
  storageBucket: "myhrlazuardi.firebasestorage.app",
  messagingSenderId: "1086201788098",
  appId: "1:1086201788098:web:629204dffa70b398f6ed5b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let isSigningIn = false;

export async function signInWithGoogle() {
  if (isSigningIn) return;
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-blocked') {
      console.error("Popup blocked. Please allow popups for this site.");
    } else if (error.code === 'auth/cancelled-popup-request') {
      console.warn("Sign-in request already in progress.");
    } else {
      console.error("Error signing in with Google", error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export async function signUp(email: string, pass: string, name: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  } catch (error) {
    console.error("Error signing up", error);
    throw error;
  }
}

export async function signIn(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error("Error signing in", error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
}

export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error resetting password", error);
    throw error;
  }
}
