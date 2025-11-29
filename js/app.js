import { ProductModel } from "./models/productModels.js";
import { ProductView } from "./views/productViews.js";

const AppController = (() => {
  const init = () => {
    console.log("AppController initialized");
    ProductView.render(ProductModel.getNewArrivals(), "newArrival");
    ProductView.render(ProductModel.getFeatured(), "featuredProducts");
  };

  return { init };
})();

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  AppController.init();
});