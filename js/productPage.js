// /js/productPage.js
import { ProductModel } from "./models/productModels.js";

const ProductPageController = (() => {

  const loadProduct = async () => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    if (!idParam) {
      const wrapper = document.getElementById("productDetails");
      if (wrapper) wrapper.innerHTML = "<p>Product not found.</p>";
      return;
    }

    const allProducts = await ProductModel.getProducts();
    const product = allProducts.find((p) => String(p.id) === idParam || Number(p.id) === Number(idParam));

    const wrapper = document.getElementById("productDetails");
    if (!product) {
      if (wrapper) wrapper.innerHTML = "<p>Product not found.</p>";
      return;
    }

    const imgEl = document.getElementById("productImg");
    const nameEl = document.getElementById("productName");
    const priceEl = document.getElementById("productPrice");
    const descEl = document.getElementById("productDescription");
    const addBtn = document.getElementById("addToCartBtn");
    const qtyInput = document.getElementById("productQty");

    // Fix GitHub Pages path
    const prefix = window.location.pathname.includes("/html/") ? "../" : "";
    const isRemoteImg = /^https?:\/\//i.test(product.img);
    const mainImgSrc = isRemoteImg ? product.img : prefix + product.img;

    if (imgEl) {
      imgEl.src = mainImgSrc;
      imgEl.alt = product.name;
    }
    if (nameEl) nameEl.textContent = product.name;
    if (priceEl) priceEl.textContent = `$${Number(product.price).toFixed(2)}`;
    if (descEl) descEl.textContent = product.description || "Nice and comfy shirt.";
    if (addBtn) {
      addBtn.dataset.id = product.id;
      addBtn.classList.add("product-cart-btn");
      if (qtyInput) {
        const setQty = () => {
          const parsed = Number(qtyInput.value);
          addBtn.dataset.qty = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
        };
        setQty();
        qtyInput.addEventListener("input", setQty);
      }
    }

    // -------------------------------
    // 🔥 REMOVE THUMBNAILS unless a real gallery exists
    // -------------------------------
    const gallery = (product.gallery && product.gallery.length) ? product.gallery : [];

    const thumbsContainer = document.getElementById("productThumbs");
    if (thumbsContainer) thumbsContainer.innerHTML = "";

    // Only render thumbnails if gallery has REAL images
    if (thumbsContainer && gallery.length > 0) {
      gallery.forEach((src, index) => {
        const thumb = document.createElement("img");
        const thumbIsRemote = /^https?:\/\//i.test(src);

        thumb.src = thumbIsRemote ? src : prefix + src;

        if (index === 0) thumb.classList.add("active");

        thumb.addEventListener("click", () => {
          imgEl.src = thumbIsRemote ? src : prefix + src;

          document
            .querySelectorAll(".single-product-thumbs img")
            .forEach((t) => t.classList.remove("active"));

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
