const newArrivals = [
  { id: 1, brand: "Chu", name: "Summer Loose Shirt", price: 78, img: "/img/ariival.png" },
  { id: 2, brand: "Chu", name: "Casual Polo Shirt", price: 79, img: "/img/arrival2.jpg" },
  { id: 3, brand: "Chu", name: "Classic Men Shirt", price: 71, img: "/img/arrival6.png" },
  { id: 4, brand: "Chu", name: "Minimalist Shirt", price: 82, img: "/img/arrival4.png" }
];

const featured = [
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

const allProducts = [...newArrivals, ...featured];

export const ProductModel = {
  getNewArrivals: () => [...newArrivals],
  getFeatured: () => [...featured],
  getProducts: () => [...allProducts]
};


const products = [
  {
    id: 1,
    brand: "adidas",
    name: "Cartoon Astronaut T-Shirts",
    price: 78,
    img: "/img/arrival1.jpg",
    description: "The Gildan Ultra Cotton T-shirt is made from a substantial 6.0 oz..."
  },
  // ...
];
