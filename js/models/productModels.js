import { DBService } from "../services/db.js";

const SEED_PRODUCTS = [
  { id: 1, brand: "Chu", name: "Summer Loose Shirt", price: 78, img: "/img/ariival.png" },
  { id: 2, brand: "Chu", name: "Casual Polo Shirt", price: 79, img: "/img/arrival2.jpg" },
  { id: 3, brand: "Chu", name: "Classic Men Shirt", price: 71, img: "/img/arrival6.png" },
  { id: 4, brand: "Chu", name: "Minimalist Shirt", price: 82, img: "/img/arrival4.png" },
  { id: 5, brand: "Chu", name: "Tank Tops for Womens 2025 Summer Casual Crewneck Tunic", price: 78, img: "/img/fea1.png" },
  { id: 6, brand: "adidas", name: "Palm Tree Tanks Tops for Mens", price: 88, img: "/img/fea2.png" },
  { id: 7, brand: "Chu", name: "Firzero 3/4 Sleeve Vintage Embroidery Shirts ", price: 94, img: "/img/fea3.png" },
  { id: 8, brand: "Sinzelimin", name: "Men's Shirts Fall Tops Vintage Plaid Printed Button", price: 102, img: "/img/fea4.png" },
  { id: 9, brand: "Chu", name: "Summer Soild Color Crew Neck Tees", price: 78, img: "/img/fea5.png" },
  { id: 10, brand: "Chu", name: "Sleeveless Athletic Workout Gym Shirts", price: 88, img: "/img/fea6.png" },
  { id: 11, brand: "Chu", name: "ace Bralettes for Women Sexy Floral", price: 94, img: "/img/fea7.png" },
  { id: 12, brand: "Chu", name: "Cotton Linen Button Down Shirts Dressy", price: 102, img: "/img/fea8.png" },
  { id: 13, brand: "Chu", name: "Crew Neck Tops Fashion Flowy Print", price: 94, img: "/img/fea9.png" },
  { id: 14, brand: "Chu", name: "Saodimallsu Womens Cap Sleeve Crop Top", price: 102, img: "/img/fea10.png" }
];

// Cache products after first load to avoid redundant fetches
let cachedProducts = [];
let hasLiveData = false;

const getSeedCopy = () => SEED_PRODUCTS.map(p => ({ ...p }));
const isSeedProduct = (product = {}) => {
  const name = (product.name || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  return SEED_PRODUCTS.some(
    seed =>
      seed.name.toLowerCase() === name &&
      seed.brand.toLowerCase() === brand
  );
};

const filterOutSeedsWhenLiveExist = (products = []) => {
  const nonSeed = products.filter(p => !isSeedProduct(p));
  // If any real products exist, only return them; otherwise keep whatever is there
  return nonSeed.length > 0 ? nonSeed : products;
};

export const ProductModel = {
  getNewArrivals: async () => {
    const all = await ProductModel.getProducts();
    return all.slice(0, 4);
  },

  getFeatured: async () => {
    const all = await ProductModel.getProducts();
    return all.slice(4, 12);
  },

  getProducts: async () => {
    if (cachedProducts.length > 0) return cachedProducts;

    try {
      const fromDb = await DBService.getAllProducts();
      const filtered = filterOutSeedsWhenLiveExist(fromDb);
      if (Array.isArray(filtered) && filtered.length > 0) {
        hasLiveData = true;
        cachedProducts = filtered;
        return cachedProducts;
      }
      console.warn("Products collection empty; using local seed data.");
    } catch (e) {
      console.warn("Failed to load products from Firestore; using local seed data.", e);
    }

    // If we reach here, no live data yet; fall back to seeds
    cachedProducts = getSeedCopy();
    return cachedProducts;
  },

  hasLiveProducts: () => hasLiveData,

  invalidateCache: () => {
    cachedProducts = [];
  },

  seedData: async () => {
    const allProducts = getSeedCopy();
    try {
      await DBService.seedProducts(allProducts);
      cachedProducts = allProducts;
      return allProducts;
    } catch (e) {
      console.warn("Seeding to Firestore failed; falling back to local data only.", e);
      cachedProducts = allProducts;
      return allProducts;
    }
  }
};
