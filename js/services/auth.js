import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/app.js";

export const AuthService = {
  signUp: async (email, password) => {
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Mirror auth user into Firestore for profile/role data
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        isAdmin: false,
        createdAt: serverTimestamp()
      });
      return { user: userCredential.user, error: null };
    } catch (error) {
      // Cleanup auth user if Firestore write failed
      if (userCredential?.user) {
        try {
          await userCredential.user.delete();
        } catch (cleanupError) {
          console.error("Failed to rollback auth user after Firestore error:", cleanupError);
        }
      }
      return { user: null, error: error.message };
    }
  },

  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  observeAuth: (callback) => {
    onAuthStateChanged(auth, callback);
  },

  checkAdminStatus: async (user) => {
    if (!user) return false;
    try {
      const tokenResult = await user.getIdTokenResult(true);
      return !!tokenResult.claims.isAdmin;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }
};
