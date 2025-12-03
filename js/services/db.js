import {
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
  collectionGroup,
  ref,
  uploadBytes,
  getDownloadURL
} from "../firebase/firebase-deps.js";
import { db, storage } from "../firebase/app.js";

const PRODUCTS_COLLECTION = "products";
const CARTS_COLLECTION = "carts";
const ORDERS_COLLECTION = "orders";

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1_000_000);
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
};

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
      products.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
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
      const payload = {
        ...productData,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), payload);
      return { id: docRef.id, ...payload };
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
      batch.set(docRef, {
        ...product,
        createdAt: product.createdAt || serverTimestamp()
      });
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
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving cart: ", e);
      throw e;
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
  },

  // --- Orders ---

  // Create an order from the current cart
  createOrder: async (userId, items = [], totals = {}, meta = {}) => {
    if (!userId) throw new Error("Missing userId for order creation");

    const subtotalFromItems = Array.isArray(items)
      ? items.reduce((sum, item) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.qty) || 0;
          return sum + price * qty;
        }, 0)
      : 0;

    const subtotal = Number.isFinite(totals.subtotal) ? totals.subtotal : subtotalFromItems;
    const total = Number.isFinite(totals.total) ? totals.total : subtotalFromItems;

    const payload = {
      userId,
      items,
      subtotal,
      discount: Number.isFinite(totals.discount) ? totals.discount : 0,
      total,
      status: "pending",
      createdAt: serverTimestamp(),
      ...meta
    };

    try {
      // Store orders in a top-level collection for easier admin querying
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const docRef = await addDoc(ordersRef, payload);
      return { id: docRef.id, ...payload };
    } catch (e) {
      console.error("Error creating order: ", e);
      throw e;
    }
  },

  getUserOrders: async (userId) => {
    if (!userId) return [];
    try {
      const ordersRef = collection(db, ORDERS_COLLECTION);
      const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
      const legacyRef = collection(db, "users", userId, "orders"); // pre-migration location

      const [topSnapshot, legacySnapshot] = await Promise.all([
        getDocs(q),
        getDocs(legacyRef).catch(() => null)
      ]);

      const topOrders = topSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      const legacyOrders = legacySnapshot
        ? legacySnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        : [];

      const combined = [...topOrders, ...legacyOrders];
      combined.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      return combined;
    } catch (e) {
      console.error("Error fetching user orders:", e);
      return [];
    }
  },

  getAllOrders: async () => {
    try {
      const topOrdersSnap = await getDocs(collection(db, ORDERS_COLLECTION));
      const legacyOrdersSnap = await getDocs(collectionGroup(db, "orders")).catch(() => null);

      const topOrders = topOrdersSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        path: docSnap.ref.path,
        ...docSnap.data()
      }));

      const legacyOrders = legacyOrdersSnap
        ? legacyOrdersSnap.docs
            .filter((docSnap) => docSnap.ref.path.startsWith("users/")) // skip top-level duplicates
            .map((docSnap) => ({
              id: docSnap.id,
              path: docSnap.ref.path,
              ...docSnap.data()
            }))
        : [];

      const combined = [...topOrders, ...legacyOrders];
      combined.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
      return combined;
    } catch (e) {
      console.error("Error fetching all orders:", e);
      return [];
    }
  },

  updateOrderStatus: async (orderPath, status) => {
    if (!orderPath || !status) return false;
    try {
      const segments = orderPath.split("/").filter(Boolean);
      const orderRef = doc(db, ...segments);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error("Error updating order status:", e);
      throw e;
    }
  }
};
