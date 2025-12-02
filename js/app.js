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
      const isInHtmlFolder = window.location.pathname.includes("/html/");
      const loginPath = isInHtmlFolder ? "login.html" : "html/login.html";

      // Remove existing admin link if any
      const existingAdminLink = document.getElementById("adminLink");
      if (existingAdminLink) {
        existingAdminLink.remove();
      }
      const existingAdminOrdersLink = document.getElementById("adminOrdersLink");
      if (existingAdminOrdersLink) {
        existingAdminOrdersLink.remove();
      }
      const existingOrdersLink = document.getElementById("ordersLink");
      if (existingOrdersLink) {
        existingOrdersLink.remove();
      }
      const ordersPlaceholder = document.getElementById("ordersNavPlaceholder");
      if (ordersPlaceholder) {
        ordersPlaceholder.remove();
      }

      if (authLink) {
        if (user) {
          authLink.innerHTML = `<a href="#" id="logoutBtn">Logout (${user.email})</a>`;
          document.getElementById("logoutBtn").addEventListener("click", async (e) => {
            e.preventDefault();
            const { error } = await AuthService.logout();
            if (error) {
              console.error("Logout failed:", error);
            }
            window.location.href = loginPath;
          });

          // Check if admin
          const isAdmin = await AuthService.checkAdminStatus(user);
          const tokenResult = await user.getIdTokenResult(true);
          console.log(isAdmin);
          if (isAdmin && navUl) {
            const adminLi = document.createElement("li");
            adminLi.id = "adminLink";
            // Check if we are in root or html folder to adjust path
            const adminPath = isInHtmlFolder ? "admin.html" : "html/admin.html";
            adminLi.innerHTML = `<a href="${adminPath}">Admin</a>`;
            // Insert before the auth link or at the end
            navUl.insertBefore(adminLi, authLink);

            const adminOrdersLi = document.createElement("li");
            adminOrdersLi.id = "adminOrdersLink";
            const adminOrdersPath = isInHtmlFolder ? "admin-orders.html" : "html/admin-orders.html";
            adminOrdersLi.innerHTML = `<a href="${adminOrdersPath}">Orders</a>`;
            navUl.insertBefore(adminOrdersLi, authLink);
          }

          // Orders link for logged-in users
          if (navUl && !isAdmin) {
            const ordersLi = document.createElement("li");
            ordersLi.id = "ordersLink";
            const ordersPath = isInHtmlFolder ? "orders.html" : "html/orders.html";
            ordersLi.innerHTML = `<a href="${ordersPath}">Orders</a>`;
            if (authLink.parentElement === navUl) {
              navUl.insertBefore(ordersLi, authLink);
            } else {
              navUl.appendChild(ordersLi);
            }
          }

        } else {
          authLink.innerHTML = `<a href="${loginPath}">Login</a>`;
        }
      }
    });

    try {
      let allProducts = await ProductModel.getProducts();

      // Only seed when there is absolutely no data
      if (allProducts.length === 0) {
        console.log("No products found. Seeding...");
        await ProductModel.seedData();
        allProducts = await ProductModel.getProducts();
      }

      if (ProductModel.isUsingSeedData && ProductModel.isUsingSeedData()) {
        console.info("[Home] Rendering seeded products (no live products found).");
      }

      const newArrivals = allProducts.slice(0, 4);
      const featured = allProducts.slice(4, 12);

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
