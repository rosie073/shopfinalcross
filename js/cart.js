// /js/cart.js
import { ProductModel } from "./models/productModels.js";
import { AuthService } from "./services/auth.js";
import { DBService } from "./services/db.js";

const CART_KEY = "chuchu_cart";
let currentUser = null;
let currentCart = []; // In-memory cart state

const Cart = (() => {

  // --- Internal Helper Methods ---

  const getLocalCart = () => {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      return [];
    }
  };

  const saveLocalCart = (cart) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  };

  const syncCart = async () => {
    if (currentUser) {
      // Save to DB
      await DBService.saveUserCart(currentUser.uid, currentCart);
    } else {
      // Save to LocalStorage
      saveLocalCart(currentCart);
    }
  };

  const refreshCartFromSource = async () => {
    if (currentUser) {
      // Load from DB
      currentCart = await DBService.getUserCart(currentUser.uid);
      // Optional: Merge local cart if it exists and we just logged in?
      // For now, simple override from DB is safer to avoid duplicates logic complexity
    } else {
      // Load from LocalStorage
      currentCart = getLocalCart();
    }
    renderCartPage();
    updateCartCountUI();
  };

  // --- Public Methods ---

  const addItem = async (productId, qty = 1) => {
    const allProducts = await ProductModel.getProducts();
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const existing = currentCart.find(i => i.id === productId);

    if (existing) {
      existing.qty += qty;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        img: product.img,
        qty
      });
    }

    await syncCart();
    renderCartPage();
    updateCartCountUI();
  };

  const removeItem = async (productId) => {
    currentCart = currentCart.filter(i => i.id !== productId);
    await syncCart();
    renderCartPage();
    updateCartCountUI();
  };

  const updateQty = async (productId, qty) => {
    const item = currentCart.find(i => i.id === productId);
    if (!item) return;

    const safeQty = qty <= 0 || Number.isNaN(qty) ? 1 : qty;
    item.qty = safeQty;

    await syncCart();
    renderCartPage();
    updateCartCountUI();
  };

  const getTotals = () => {
  let subtotal = currentCart.reduce((sum, i) => sum + i.price * i.qty, 0);
  let discount = appliedCoupon ? subtotal * coupons[appliedCoupon] : 0;
  let total = subtotal - discount;

  return { subtotal, discount, total };
};

document.addEventListener("click", (e) => {
  const applyBtn = e.target.closest(".apply-btn");
  if (!applyBtn) return;

  const input = document.querySelector(".coupon-input input");
  if (input.value.trim()) applyCoupon(input.value.trim());
});







  let appliedCoupon = null;
const coupons = {
  "SAVE10": 0.10,  // 10%
  "SAVE20": 0.20   // 20%
};

const applyCoupon = (code) => {
  const coupon = code.toUpperCase();
  if (coupons[coupon]) {
    appliedCoupon = coupon;
    alert(`Coupon ${coupon} applied!`);
    updateTotalsUI();
  } else {
    alert("Invalid coupon code.");
  }
};


  const updateCartCountUI = () => {
    const badge = document.querySelector(".cart-count");
    if (!badge) return;

    const count = currentCart.reduce((sum, i) => sum + i.qty, 0);

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

    tbody.innerHTML = "";

    if (!currentCart.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">Your cart is empty.</td>
        </tr>
      `;
    } else {
      currentCart.forEach(item => {
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
  const { subtotal, discount, total } = getTotals();

  document.getElementById("cartSubtotal").textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById("cartTotal").textContent = `$${total.toFixed(2)}`;

  localStorage.setItem("checkout_data", JSON.stringify({
    subtotal, discount, total, appliedCoupon
  }));
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

    // Auth Listener to switch cart sources
    AuthService.observeAuth(async (user) => {
      currentUser = user;
      await refreshCartFromSource();
    });
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  Cart.init();
});
