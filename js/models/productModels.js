const newArrivals = [
  {
    id: 1,
    brand: "Chu",
    name: "Summer Loose Shirt",
    price: 78,
    img: "img/ariival.png",
    gallery: [
      "img/ariival.png",
      "img/ar1.png",
      "img/ar2.png",
      "img/ar3.png"
    ]
  },
  {
    id: 2,
    brand: "Chu",
    name: "Casual Polo Shirt",
    price: 79,
    img: "img/arrival2.jpg",
    gallery: [
      "img/arrival2.jpg",
      "img/arr11.png",
      "img/arr22.png",
      "img/arr33.png"
    ]
  },
  {
    id: 3,
    brand: "Chu",
    name: "Classic Men Shirt",
    price: 71,
    img: "img/arrival6.png",
    gallery: [
      "img/arrival6.png",
      "img/rar1.png",
      "img/rar2.png",
      "img/rar3.png"
    ]
  },
  {
    id: 4,
    brand: "Chu",
    name: "Minimalist Shirt",
    price: 82,
    img: "img/arrival4.png",
    gallery: [
      "img/arrival4.png",
      "img/adi1.png",
      "img/adi3.png",
      "img/adi4.png"
    ]
  }
];

const featured = [
  {
    id: 5,
    brand: "Chu",
    name: "Tank Tops for Womens 2025 Summer Casual Crewneck Tunic",
    price: 78,
    img: "img/fea1.png",
    gallery: [
      "img/fea1.png",
      "img/fe1.png",
      "img/fe2.png",
      "img/fe3.png"
    ]
  },
  {
    id: 6,
    brand: "Asisi",
    name: "Palm Tree Tanks Tops for Mens",
    price: 88,
    img: "img/fea2.png",
    gallery: [
      "img/fea2.png",
      "img/fea2_black.png",
      "img/fea2_white.png",
      "img/fea2_orange.png"
    ]
  },
  {
    id: 7,
    brand: "Chu",
    name: "Firzero 3/4 Sleeve Vintage Embroidery Shirts ",
    price: 94,
    img: "img/fea3.png",
    gallery: [
      "img/fea3.png",
      "img/fea3_blue.png",
      "img/fea3_brown.png",
      "img/fea3_green.png"
    ]
  },
  {
    id: 8,
    brand: "Sinzelimin",
    name: "Men's Shirts Fall Tops Vintage Plaid Printed Button",
    price: 102,
    img: "img/fea4.png",
    gallery: [
      "img/fea4.png",
      "img/fea4_blue.png",
      "img/fea4_green.png",
      "img/fea4_orange.png"
    ]
  },
  {
    id: 9,
    brand: "Chu",
    name: "Summer Soild Color Crew Neck Tees",
    price: 78,
    img: "img/fea5.png",
    gallery: [
      "img/fea5.png",
      "img/fea5_black.png",
      "img/fea5_white.png",
      "img/fea5_yellow.png"
    ]
  },
  {
    id: 10,
    brand: "Chu",
    name: "Sleeveless Athletic Workout Gym Shirts",
    price: 88,
    img: "img/fea6.png",
    gallery: [
      "img/fea6.png",
      "img/fea6_blue.png",
      "img/fea6_red.png",
      "img/fea6_grey.png"
    ]
  },
  {
    id: 11,
    brand: "Chu",
    name: "ace Bralettes for Women Sexy Floral",
    price: 94,
    img: "img/fea7.png",
    gallery: [
      "img/fea7.png",
      "img/fea7_pink.png",
      "img/fea7_white.png",
      "img/fea7_black.png"
    ]
  },
  {
    id: 12,
    brand: "Chu",
    name: "Cotton Linen Button Down Shirts Dressy",
    price: 102,
    img: "img/fea8.png",
    gallery: [
      "img/fea8.png",
      "img/fea8_blue.png",
      "img/fea8_brown.png",
      "img/fea8_grey.png"
    ]
  },
  {
    id: 13,
    brand: "Chu",
    name: "Crew Neck Tops Fashion Flowy Print",
    price: 94,
    img: "img/fea9.png",
    gallery: [
      "img/fea9.png",
      "img/fea9_blue.png",
      "img/fea9_green.png",
      "img/fea9_yellow.png"
    ]
  },
  {
    id: 14,
    brand: "Chu",
    name: "Saodimallsu Womens Cap Sleeve Crop Top",
    price: 102,
    img: "img/fea10.png",
    gallery: [
      "img/fea10.png",
      "img/fea10_blue.png",
      "img/fea10_green.png",
      "img/fea10_red.png"
    ]
  }
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
    img: "img/arrival1.jpg",
    description: "The Gildan Ultra Cotton T-shirt is made from a substantial 6.0 oz..."
  },
  // ...
];



