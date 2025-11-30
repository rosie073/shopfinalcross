import { ProductModel } from "./models/productModels.js";
import { ProductView } from "./views/productViews.js";
import { AuthService } from "./services/auth.js";

const AppController = (() => {
  const init = async () => {
    console.log("AppController initialized");

    // Check auth state for navbar
    AuthService.observeAuth(async (user) => {
      const authLink = document.getElementById("authLink");
      const navUl = document.querySelector(".navbar nav ul");

      // Remove existing admin link if any
      const existingAdminLink = document.getElementById("adminLink");
      if (existingAdminLink) {
        existingAdminLink.remove();
      }

      if (authLink) {
        if (user) {
          authLink.innerHTML = `<a href="#" id="logoutBtn">Logout (${user.email})</a>`;
          document.getElementById("logoutBtn").addEventListener("click", async (e) => {
            e.preventDefault();
            await AuthService.logout();
            window.location.reload();
          });

          // Check if admin
          const isAdmin = await AuthService.checkAdminStatus(user);
          const tokenResult = await user.getIdTokenResult(true);
          console.log(tokenResult);
          if (isAdmin && navUl) {
            const adminLi = document.createElement("li");
            adminLi.id = "adminLink";
            // Check if we are in root or html folder to adjust path
            const isInHtmlFolder = window.location.pathname.includes("/html/");
            const adminPath = isInHtmlFolder ? "admin.html" : "html/admin.html";
            adminLi.innerHTML = `<a href="${adminPath}">Admin</a>`;
            // Insert before the auth link or at the end
            navUl.insertBefore(adminLi, authLink);
          }

        } else {
          authLink.innerHTML = `<a href="html/login.html">Login</a>`;
        }
      }
    });

    try {
      let newArrivals = await ProductModel.getNewArrivals();
      let featured = await ProductModel.getFeatured();

      // If empty, attempt to seed; if Firestore blocks, show local data instead
      if (newArrivals.length === 0 && featured.length === 0) {
        console.log("No products found. Seeding...");
        await ProductModel.seedData();
        newArrivals = await ProductModel.getNewArrivals();
        featured = await ProductModel.getFeatured();
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
