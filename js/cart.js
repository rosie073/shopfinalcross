// /js/cart.js
import { ProductModel } from "./models/productModels.js";

const CART_KEY = "chuchu_cart";

const Cart = (() => {
  const getCart = () => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  };

  const saveCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  };

  const addItem = (productId, qty = 1) => {
    const allProducts = ProductModel.getProducts();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const cart = getCart();
    const existing = cart.find(i => i.id === productId);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        qty
      });
    }

    saveCart(cart);
    updateCartCountUI();
  };

  const removeItem = (productId) => {
    const cart = getCart().filter(i => i.id !== productId);
    saveCart(cart);
    renderCartPage();
    updateCartCountUI();
  };

  const updateQty = (productId, qty) => {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const safeQty = qty <= 0 || Number.isNaN(qty) ? 1 : qty;
    item.qty = safeQty;

    saveCart(cart);
    renderCartPage();
    updateCartCountUI();
  };

  const getTotals = () => {
    const cart = getCart();
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
    return { subtotal, total: subtotal }; // shipping is free
  };

  const updateCartCountUI = () => {
    const badge = document.querySelector(".cart-count");
    if (!badge) return;

    const cart = getCart();
    const count = cart.reduce((sum, i) => sum + i.qty, 0);

    badge.textContent = count;
    badge.style.display = count ? "inline-flex" : "none";
  };

  // Listen for "Add to Cart" click anywhere
  const handleAddToCartClicks = () => {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".product-cart-btn");
      if (!btn) return;

      // stop the <a> from navigating when clicking the button
      e.preventDefault();
      e.stopPropagation();

      const id = Number(btn.dataset.id);
      if (!id) return;

      addItem(id, 1);
    });
  };

  const renderCartPage = () => {
    const tbody = document.querySelector(".cart-table tbody");
    if (!tbody) return; // not on cart page

    const cart = getCart();
    tbody.innerHTML = "";

    if (!cart.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">Your cart is empty.</td>
        </tr>
      `;
    } else {
      cart.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="remove" data-id="${item.id}">×</td>
          <td><img src="${item.img}" class="cart-img"></td>
          <td>${item.name}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>
            <input
              type="number"
              min="1"
              value="${item.qty}"
              class="cart-qty"
              data-id="${item.id}"
            >
          </td>
          <td>$${(item.price * item.qty).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    updateTotalsUI();
  };

  const updateTotalsUI = () => {
    const subtotalEl = document.getElementById("cartSubtotal");
    const totalEl = document.getElementById("cartTotal");
    if (!subtotalEl || !totalEl) return;

    const { subtotal, total } = getTotals();
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
  };

  const bindCartPageEvents = () => {
    // remove item
    document.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".remove");
      if (removeBtn && removeBtn.dataset.id) {
        const id = Number(removeBtn.dataset.id);
        removeItem(id);
      }
    });

    // change quantity
    document.addEventListener("change", (e) => {
      const input = e.target.closest(".cart-qty");
      if (input && input.dataset.id) {
        const id = Number(input.dataset.id);
        const qty = Number(input.value);
        updateQty(id, qty);
      }
    });
  };

  const init = () => {
    handleAddToCartClicks(); // works on all pages
    bindCartPageEvents();    // only does anything on cart page
    renderCartPage();        // if we *are* on cart page
    updateCartCountUI();     // updates little badge in nav
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  Cart.init();
});
