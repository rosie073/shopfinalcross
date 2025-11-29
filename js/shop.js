// /js/shop.js
import { ProductModel } from "./models/productModels.js";
import { ProductView } from "./views/productViews.js";

const ShopController = (() => {
  let currentPage = 1;
  const itemsPerPage = 10;
  let totalPages = 1;

  const renderPage = () => {
    const allProducts = ProductModel.getProducts();
    totalPages = Math.ceil(allProducts.length / itemsPerPage);

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    ProductView.render(allProducts.slice(start, end), "shopProducts");
    updatePaginationUI();
  };

  const updatePaginationUI = () => {
    // number buttons
    document.querySelectorAll(".pagination button[data-page]").forEach(btn => {
      const page = Number(btn.dataset.page);
      btn.classList.toggle("active", page === currentPage);
      btn.disabled = page > totalPages; // in case there are fewer pages
    });

    // next arrow
    const nextBtn = document.getElementById("nextPage");
    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages;   // stop at last page
    }
  };

  const bindEvents = () => {
    // click 1 or 2
    document.querySelectorAll(".pagination button[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.page);
        if (!isNaN(page) && page !== currentPage) {
          currentPage = page;
          renderPage();
        }
      });
    });

    // click arrow →
    const nextBtn = document.getElementById("nextPage");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage += 1;       // page 1 -> 2
          renderPage();
        }
      });
    }
  };

  const init = () => {
    bindEvents();
    renderPage();   // first load shows 10 products
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  ShopController.init();
});
