import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigData.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId || '(default)',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
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
    } else if (error.code === 'auth/unauthorized-domain') {
      console.error("Unauthorized Domain Error: You must add the current domain to your Firebase Console Authorized Domains list.\n" +
                    "Domains to add:\n" +
                    "- ais-dev-g7clsbxiauhzyam5eatuii-571345004401.asia-southeast1.run.app\n" +
                    "- ais-pre-g7clsbxiauhzyam5eatuii-571345004401.asia-southeast1.run.app");
      throw new Error("This domain is not authorized for sign-in. Please check the console for instructions.");
    } else {
      console.error("Error signing in with Google", error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
}

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

export async function signUp(email: string, pass: string, name: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(result.user, { displayName: name });
    }
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("User already exists. Please sign in");
    }
    console.error("Error signing up", error);
    throw error;
  }
}

export async function signIn(email: string, pass: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: any) {
    if (
      error.code === 'auth/user-not-found' || 
      error.code === 'auth/wrong-password' || 
      error.code === 'auth/invalid-credential'
    ) {
      throw new Error("Email or password is incorrect");
    }
    console.error("Error signing in", error);
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

// Firestore Error Handler (kept for types, but connection test removed as per user request to only use Auth)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
