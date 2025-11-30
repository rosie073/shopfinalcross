import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../firebase/app.js";

const PRODUCTS_COLLECTION = "products";
const CARTS_COLLECTION = "carts";

export const DBService = {
  // --- Products ---

  // Fetch all products
  getAllProducts: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: Number(doc.id), ...doc.data() });
      });
      return products;
    } catch (e) {
      console.error("Error getting products: ", e);
      return [];
    }
  },

  // Fetch single product by ID (assuming ID is stored as document ID or field)
  // Based on current architecture, IDs are numbers like 1, 2, 3.
  // We will store them as document IDs "1", "2", "3" for simplicity.
  getProductById: async (id) => {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, String(id));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: Number(docSnap.id), ...docSnap.data() };
      } else {
        return null;
      }
    } catch (e) {
      console.error("Error getting product: ", e);
      return null;
    }
  },

  // Seed products (Admin/Dev utility)
  seedProducts: async (products) => {
    const batch = writeBatch(db);
    products.forEach((product) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, String(product.id));
      batch.set(docRef, product);
    });
    await batch.commit();
    console.log("Products seeded successfully");
  },

  // --- Cart ---

  // Save entire cart for a user
  saveUserCart: async (userId, cartItems) => {
    try {
      await setDoc(doc(db, CARTS_COLLECTION, userId), {
        items: cartItems,
        updatedAt: new Date()
      });
    } catch (e) {
      console.error("Error saving cart: ", e);
    }
  },

  // Get cart for a user
  getUserCart: async (userId) => {
    try {
      const docRef = doc(db, CARTS_COLLECTION, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().items || [];
      }
      return [];
    } catch (e) {
      console.error("Error loading cart: ", e);
      return [];
    }
  }
};
