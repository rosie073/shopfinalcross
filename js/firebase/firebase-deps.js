// Centralized Firebase ESM imports from the CDN so browsers without import map support still work.
export { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";

export {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

export {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  where,
  orderBy,
  collectionGroup
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

export { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-storage.js";
