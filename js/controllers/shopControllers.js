import { ProductModel } from "../models/productModels.js";
import { ProductView } from "../views/productViews.js";

export const ShopController = (() => {

  let currentPage = 1;
  const itemsPerPage = 4;

  const paginate = async (page) => {
    const allProducts = await ProductModel.getProducts();
    const start = (page - 1) * itemsPerPage;
    const end = page * itemsPerPage;

    ProductView.render(allProducts.slice(start, end), "shopProducts");
  };

  const setActive = (page) => {
    document.querySelectorAll(".pagination button").forEach(btn =>
      btn.classList.remove("active")
    );
    const btn = document.getElementById("page" + page);
    if (btn) btn.classList.add("active");
  };

  const events = () => {
    const p1 = document.getElementById("page1");
    if(p1) p1.onclick = () => {
      paginate(1);
      setActive(1);
    };

    const p2 = document.getElementById("page2");
    if(p2) p2.onclick = () => {
      paginate(2);
      setActive(2);
    };

    const next = document.getElementById("nextPage");
    if(next) next.onclick = () => {
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
