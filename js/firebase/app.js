import { initializeApp, getAuth, getFirestore, getStorage } from "./firebase-deps.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
