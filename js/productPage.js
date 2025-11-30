// /js/productPage.js
import { ProductModel } from "./models/productModels.js";

const ProductPageController = (() => {
  const loadProduct = () => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const id = Number(idParam);

    const allProducts = ProductModel.getProducts();
    const product = allProducts.find(p => p.id === id);

    const wrapper = document.getElementById("productDetails");
    if (!product) {
      if (wrapper) wrapper.innerHTML = "<p>Product not found.</p>";
      return;
    }

    const imgEl   = document.getElementById("productImg");
    const nameEl  = document.getElementById("productName");
    const priceEl = document.getElementById("productPrice");
    const descEl  = document.getElementById("productDescription");

    // 👇 this is the important bit for GitHub Pages
    const prefix = window.location.pathname.includes("/html/") ? "../" : "";
    const mainImgSrc = prefix + product.img;

    if (imgEl) {
      imgEl.src = mainImgSrc;
      imgEl.alt = product.name;
    }
    if (nameEl)  nameEl.textContent  = product.name;
    if (priceEl) priceEl.textContent = `$${product.price.toFixed(2)}`;
    if (descEl)  descEl.textContent  = product.description || "Nice and comfy shirt.";

    // THUMBNAILS
    const thumbsContainer = document.getElementById("productThumbs");
    if (thumbsContainer && imgEl) {
      const gallery = product.gallery && product.gallery.length
        ? product.gallery
        : [product.img, product.img, product.img, product.img]; // repeat main img if no gallery

      thumbsContainer.innerHTML = "";

      gallery.forEach((src, index) => {
        const thumb = document.createElement("img");
        thumb.src = prefix + src;          // 👈 use same prefix here
        if (index === 0) thumb.classList.add("active");

        thumb.addEventListener("click", () => {
          imgEl.src = prefix + src;
          document
            .querySelectorAll(".single-product-thumbs img")
            .forEach(t => t.classList.remove("active"));
          thumb.classList.add("active");
        });

        thumbsContainer.appendChild(thumb);
      });
    }
  };

  const init = () => {
    loadProduct();
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  ProductPageController.init();
});
