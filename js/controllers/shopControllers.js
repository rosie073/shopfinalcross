import { ProductModel } from "../models/productModels.js";
import { ProductView } from "../views/productViews.js";

export const ShopController = (() => {

  let currentPage = 1;
  const itemsPerPage = 4;

  const paginate = (page) => {
    const allProducts = ProductModel.getProducts();
    const start = (page - 1) * itemsPerPage;
    const end = page * itemsPerPage;

    ProductView.render(allProducts.slice(start, end), "shopProducts");
  };

  const setActive = (page) => {
    document.querySelectorAll(".pagination button").forEach(btn =>
      btn.classList.remove("active")
    );
    document.getElementById("page" + page).classList.add("active");
  };

  const events = () => {
    document.getElementById("page1").onclick = () => {
      paginate(1);
      setActive(1);
    };

    document.getElementById("page2").onclick = () => {
      paginate(2);
      setActive(2);
    };

    document.getElementById("nextPage").onclick = () => {
      currentPage = currentPage === 1 ? 2 : 1;
      paginate(currentPage);
      setActive(currentPage);
    };
  };

  const init = () => {
    paginate(1);
    events();
  };

  return { init };

})();
