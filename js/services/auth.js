import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  sendEmailVerification
} from "../firebase/firebase-deps.js";
import { auth, db } from "../firebase/app.js";

let adminFallbackLogged = false;

const persistenceFor = (rememberMe = false) =>
  rememberMe ? browserLocalPersistence : browserSessionPersistence;

const setAuthPersistence = async (rememberMe = false) => {
  try {
    await setPersistence(auth, persistenceFor(rememberMe));
  } catch (error) {
    // Do not block auth if persistence fails (Safari ITP, etc.)
    console.warn("Could not set auth persistence; falling back to Firebase default.", error);
  }
};

const ensureUserDocument = async (user, extraProfile = {}) => {
  if (!user) return;
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(
        userRef,
        {
          email: user.email || "",
          isAdmin: false,
          createdAt: serverTimestamp(),
          ...extraProfile
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.warn("Failed to ensure user profile exists:", error);
  }
};

const sendVerificationEmail = async (user) => {
  if (!user) return { sent: false };
  try {
    await sendEmailVerification(user);
    return { sent: true };
  } catch (error) {
    console.warn("Failed to send verification email:", error);
    return { sent: false, error };
  }
};

const mapAuthError = (error) => {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "That email is already registered.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/missing-password":
      return "Enter your password to continue.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return error?.message || "Unable to process your request right now.";
  }
};

export const AuthService = {
  signUp: async (email, password, options = {}) => {
    const { fullName, username, rememberMe } = options;
    let userCredential;
    try {
      await setAuthPersistence(!!rememberMe);
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (fullName) {
        try {
          await updateProfile(user, { displayName: fullName });
        } catch (profileError) {
          console.warn("Failed to set display name:", profileError);
        }
      }

      await setDoc(doc(db, "users", user.uid), {
        email,
        fullName: fullName || null,
        username: username || null,
        isAdmin: false,
        createdAt: serverTimestamp()
      });

      const verificationStatus = await sendVerificationEmail(user);
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.warn("Sign-out after signup failed:", signOutError);
      }

      return {
        user,
        error: null,
        requiresEmailVerification: true,
        verificationEmailSent: verificationStatus.sent
      };
    } catch (error) {
      // Cleanup auth user if Firestore write failed
      if (userCredential?.user) {
        try {
          await userCredential.user.delete();
        } catch (cleanupError) {
          console.error("Failed to rollback auth user after Firestore error:", cleanupError);
        }
      }
      return { user: null, error: mapAuthError(error) };
    }
  },

  login: async (email, password, options = {}) => {
    const { rememberMe } = options;
    try {
      await setAuthPersistence(!!rememberMe);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        const verificationStatus = await sendVerificationEmail(user);
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.warn("Sign-out after login verification check failed:", signOutError);
        }
        return {
          user: null,
          error: "Please verify your email before logging in.",
          requiresEmailVerification: true,
          verificationEmailSent: verificationStatus.sent
        };
      }

      await ensureUserDocument(user);
      return { user, error: null };
    } catch (error) {
      return { user: null, error: mapAuthError(error) };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: mapAuthError(error) };
    }
  },

  observeAuth: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  checkAdminStatus: async (user) => {
    if (!user) return false;
    try {
      const tokenResult = await user.getIdTokenResult(true);
      if (tokenResult.claims?.isAdmin) return true;

      // Firestore admin collection: admin/{uid} -> { isAdmin: true }
      try {
        const adminDoc = await getDoc(doc(db, "admin", user.uid));
        if (adminDoc.exists() && adminDoc.data().isAdmin === true) return true;
      } catch (e) {
        if (!adminFallbackLogged) {
          console.warn("Admin collection read blocked; falling back to users collection.", e);
          adminFallbackLogged = true;
        }
      }

      // Fallback to users/{uid} -> { isAdmin: true }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      return userDoc.exists() && userDoc.data().isAdmin === true;
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }
};
