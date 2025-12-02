// /js/cart.js
import { ProductModel } from "./models/productModels.js";
import { AuthService } from "./services/auth.js";
import { DBService } from "./services/db.js";

const CART_KEY = "chuchu_cart";
let currentUser = null;
let currentCart = []; // In-memory cart state
const normalizeId = (id) => String(id);
const notify = (title, text = "", icon = "info") => {
  if (window.Swal?.fire) {
    return window.Swal.fire({ title, text, icon, timer: 1600, showConfirmButton: false });
  }
  if (typeof window.swal === "function") {
    return window.swal(title, text, icon);
  }
  alert(text ? `${title}: ${text}` : title);
};

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
    try {
      if (currentUser) {
        // Save to DB
        await DBService.saveUserCart(currentUser.uid, currentCart);
      } else {
        // Save to LocalStorage
        saveLocalCart(currentCart);
      }
    } catch (e) {
      console.error("Failed to sync cart:", e);
      notify("Could not save cart", "Please try again.", "error");
      throw e;
    }
  };

  const refreshCartFromSource = async () => {
    try {
      if (currentUser) {
        // Load from DB
        currentCart = await DBService.getUserCart(currentUser.uid);
        // Optional: Merge local cart if it exists and we just logged in?
        // For now, simple override from DB is safer to avoid duplicates logic complexity
      } else {
        // Load from LocalStorage
        currentCart = getLocalCart();
      }
    } catch (e) {
      console.error("Failed to load cart:", e);
      notify("Could not load cart", "Please try again.", "error");
    }
    renderCartPage();
    updateCartCountUI();
  };

  const getLoginPath = () => {
    const isInHtml = window.location.pathname.includes("/html/");
    return isInHtml ? "login.html" : "html/login.html";
  };

  const getCheckoutPath = () => {
    const isInHtml = window.location.pathname.includes("/html/");
    return isInHtml ? "checkout.html" : "html/checkout.html";
  };

  const redirectToLogin = () => {
    const loginPath = getLoginPath();
    // small delay so alert can show
    setTimeout(() => { window.location.href = loginPath; }, 600);
  };

  // --- Public Methods ---

  const addItem = async (productId, qty = 1) => {
    try {
      // If we're not logged in, make sure we merge any existing local cart first
      if (!currentUser && currentCart.length === 0) {
        currentCart = getLocalCart();
      }

      const normalizedId = normalizeId(productId);
      const allProducts = await ProductModel.getProducts();
      const product = allProducts.find(p => normalizeId(p.id) === normalizedId);
      if (!product) {
        notify("Add to cart failed", "Product not found.", "error");
        return false;
      }

      const existing = currentCart.find(i => normalizeId(i.id) === normalizedId);

      if (existing) {
        existing.qty += qty;
      } else {
        currentCart.push({
          id: normalizedId,
          name: product.name,
          price: product.price,
          img: product.img,
          qty
        });
      }

      await syncCart();
      renderCartPage();
      updateCartCountUI();
      notify("Added to cart", product.name, "success");
      return true;
    } catch (e) {
      console.error("Add to cart failed", e);
      notify("Add to cart failed", "Please try again.", "error");
      return false;
    }
  };

  const removeItem = async (productId) => {
    const normalizedId = normalizeId(productId);
    currentCart = currentCart.filter(i => normalizeId(i.id) !== normalizedId);
    await syncCart();
    renderCartPage();
    updateCartCountUI();
  };

  const updateQty = async (productId, qty) => {
    const normalizedId = normalizeId(productId);
    const item = currentCart.find(i => normalizeId(i.id) === normalizedId);
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


  const updateCheckoutButtonState = () => {
    const checkoutBtn = document.querySelector(".checkout-btn");
    if (!checkoutBtn) return;

    const hasItems = currentCart.length > 0;
    checkoutBtn.disabled = !hasItems;
    checkoutBtn.classList.toggle("is-disabled", !hasItems);
  };

  const updateCartCountUI = () => {
    const badges = document.querySelectorAll(".cart-count");
    if (!badges.length) return;

    const count = currentCart.reduce((sum, i) => sum + i.qty, 0);

    badges.forEach((badge) => {
      badge.textContent = count;
      badge.style.display = count ? "inline-flex" : "none";
      const link = badge.closest(".cart-link");
      if (link) {
        link.classList.toggle("has-items", !!count);
      }
    });
  };

  const checkout = async () => {
    if (!currentCart.length) {
      notify("Cart is empty", "Add items before checking out.", "warning");
      return;
    }

    if (!currentUser) {
      notify("Login required", "Please login to complete your purchase.", "warning");
      redirectToLogin();
      return;
    }

    const checkoutBtn = document.querySelector(".checkout-btn");
    if (checkoutBtn) checkoutBtn.disabled = true;

    try {
      const totals = getTotals();
      const order = await DBService.createOrder(currentUser.uid, currentCart, totals, {
        email: currentUser.email || null
      });

      currentCart = [];
      await syncCart();
      renderCartPage();
      updateCartCountUI();

      const orderId = order?.id ? String(order.id) : "";
      const orderLabel = orderId ? `Order ${orderId.slice(0, 8)}` : "Order placed";
      notify(orderLabel, "Your order has been saved.", "success");
    } catch (e) {
      console.error("Checkout failed", e);
      notify("Checkout failed", "Please try again.", "error");
    } finally {
      updateCheckoutButtonState();
    }
  };

  // Listen for "Add to Cart" click anywhere
  const handleAddToCartClicks = () => {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".product-cart-btn");
      if (!btn) return;

      // stop the <a> from navigating when clicking the button
      e.preventDefault();
      e.stopPropagation();

      const id = btn.dataset.id;
      if (!id) return;

      const qtyAttr = Number(btn.dataset.qty);
      const qty = Number.isFinite(qtyAttr) && qtyAttr > 0 ? qtyAttr : 1;

      addItem(id, qty);
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
    updateCheckoutButtonState();
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
    // checkout
    const checkoutBtn = document.querySelector(".checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", (e) => {
        e.preventDefault();

        if (!currentCart.length) {
          notify("Cart is empty", "Add items before checking out.", "warning");
          return;
        }

        updateTotalsUI(); // persist latest totals for the checkout page
        window.location.href = getCheckoutPath();
      });
    }

    // remove item
    document.addEventListener("click", (e) => {
      const removeBtn = e.target.closest(".remove");
      if (removeBtn && removeBtn.dataset.id) {
        const id = removeBtn.dataset.id;
        removeItem(id);
      }
    });

    // change quantity
    document.addEventListener("change", (e) => {
      const input = e.target.closest(".cart-qty");
      if (input && input.dataset.id) {
        const id = input.dataset.id;
        const qty = Number(input.value);
        updateQty(id, qty);
      }
    });
  };

  const init = () => {
    handleAddToCartClicks(); // works on all pages
    bindCartPageEvents();    // only does anything on cart page
    updateCheckoutButtonState();

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
