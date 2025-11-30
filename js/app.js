import { ProductModel } from "./models/productModels.js";
import { ProductView } from "./views/productViews.js";
import { AuthService } from "./services/auth.js";

const AppController = (() => {
  const init = async () => {
    console.log("AppController initialized");

    // Check auth state for navbar
    AuthService.observeAuth((user) => {
      const authLink = document.getElementById("authLink");
      if (authLink) {
        if (user) {
          authLink.innerHTML = `<a href="#" id="logoutBtn">Logout (${user.email})</a>`;
          document.getElementById("logoutBtn").addEventListener("click", async (e) => {
            e.preventDefault();
            await AuthService.logout();
            window.location.reload();
          });
        } else {
          authLink.innerHTML = `<a href="html/login.html">Login</a>`;
        }
      }
    });

    try {
      const newArrivals = await ProductModel.getNewArrivals();
      const featured = await ProductModel.getFeatured();

      // If empty, maybe we need to seed?
      if (newArrivals.length === 0 && featured.length === 0) {
        console.log("No products found. Seeding...");
        await ProductModel.seedData();
        // reload to show data? or just fetch again
        window.location.reload();
        return;
      }

      ProductView.render(newArrivals, "newArrival");
      ProductView.render(featured, "featuredProducts");
    } catch (e) {
      console.error("Failed to load products:", e);
    }
  };

  return { init };
})();

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  AppController.init();
});
