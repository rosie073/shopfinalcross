// /js/productPage.js
import { ProductModel } from "./models/productModels.js";

const ProductPageController = (() => {
  const loadProduct = () => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    const id = Number(idParam);

    const allProducts = ProductModel.getProducts();
    const product = allProducts.find(p => p.id === id);

    if (!product) {
      const wrapper = document.getElementById("productDetails");
      if (wrapper) wrapper.innerHTML = "<p>Product not found.</p>";
      return;
    }

    // Fill the page
    const imgEl   = document.getElementById("productImg");
    const nameEl  = document.getElementById("productName");
    const priceEl = document.getElementById("productPrice");
    const descEl  = document.getElementById("productDescription");

    if (imgEl) {
      imgEl.src = product.img;
      imgEl.alt = product.name;
    }
    if (nameEl)  nameEl.textContent  = product.name;
    if (priceEl) priceEl.textContent = `$${product.price.toFixed(2)}`;
    if (descEl)  descEl.textContent  = product.description || "Nice and comfy shirt.";
  };

  const init = () => {
    loadProduct();
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  ProductPageController.init();
});


// after we set imgEl.src etc. in loadProduct()

const thumbsContainer = document.getElementById("productThumbs");
if (thumbsContainer) {
  const gallery = product.gallery && product.gallery.length
    ? product.gallery
    : [product.img, product.img, product.img, product.img]; // repeats main img

  thumbsContainer.innerHTML = "";

  gallery.forEach((src, index) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    if (index === 0) thumb.classList.add("active");
    thumb.addEventListener("click", () => {
      imgEl.src = src;
      document
        .querySelectorAll(".single-product-thumbs img")
        .forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
    thumbsContainer.appendChild(thumb);
  });
}
