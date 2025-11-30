import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/app.js";

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
        // Handle both numeric IDs (legacy) and string IDs (auto-generated)
        const id = isNaN(Number(doc.id)) ? doc.id : Number(doc.id);
        products.push({ id, ...doc.data() });
      });
      return products;
    } catch (e) {
      console.error("Error getting products: ", e);
      return [];
    }
  },

  // Fetch single product by ID
  getProductById: async (id) => {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, String(id));
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docId = isNaN(Number(docSnap.id)) ? docSnap.id : Number(docSnap.id);
        return { id: docId, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (e) {
      console.error("Error getting product: ", e);
      return null;
    }
  },

  // Add a new product (Auto ID)
  addProduct: async (productData) => {
    try {
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productData);
      return { id: docRef.id, ...productData };
    } catch (e) {
      console.error("Error adding product: ", e);
      throw e;
    }
  },

  // Update a product
  updateProduct: async (id, productData) => {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, String(id));
      await updateDoc(docRef, productData);
      return { id, ...productData };
    } catch (e) {
      console.error("Error updating product: ", e);
      throw e;
    }
  },

  // Delete a product
  deleteProduct: async (id) => {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, String(id));
      await deleteDoc(docRef);
      return true;
    } catch (e) {
      console.error("Error deleting product: ", e);
      throw e;
    }
  },

  // Upload product image
  uploadProductImage: async (file) => {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `products/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (e) {
      console.error("Error uploading image: ", e);
      throw e;
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
