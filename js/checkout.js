import { DBService } from "./services/db.js";
import { AuthService } from "./services/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const summaryBox = document.getElementById("summaryTotals");
  const errorBox = document.getElementById("errorMessage");
  const successModal = document.getElementById("orderSuccessModal");
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  let checkoutData = JSON.parse(localStorage.getItem("checkout_data")) || {};
  let cartItems = [];
  let currentUser = null;

  const getTotals = () => {
    const subtotal =
      Number(checkoutData.subtotal) ||
      cartItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0);
    const discount = Number(checkoutData.discount) || 0;
    const total = Number(checkoutData.total) || Math.max(subtotal - discount, 0);
    const coupon = checkoutData.appliedCoupon || "None";
    return { subtotal, discount, total, coupon };
  };

  const renderSummary = () => {
    const { subtotal, discount, total, coupon } = getTotals();
    summaryBox.innerHTML = `
      <p>Cart Subtotal: <strong>$${subtotal.toFixed(2)}</strong></p>
      <p>Coupon Applied: <strong>${coupon}</strong></p>
      <p>Discount: <strong>-$${discount.toFixed(2)}</strong></p>
      <p>Shipping: <strong>Free</strong></p>
      <hr>
      <p><strong>Total: $${total.toFixed(2)}</strong></p>
    `;
  };

  const loadCart = async (user) => {
    if (!user) return [];
    try {
      const items = await DBService.getUserCart(user.uid);
      cartItems = items || [];
      renderSummary();
    } catch (e) {
      console.error("Failed to load cart for checkout:", e);
      cartItems = [];
    }
  };

  AuthService.observeAuth(async (user) => {
    currentUser = user;
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    await loadCart(user);
  });

  renderSummary();

  const validateForm = () => {
    const name = document.getElementById("buyerName").value.trim();
    const phone = document.getElementById("buyerPhone").value.trim();
    const address = document.getElementById("buyerAddress").value.trim();
    const payment = document.querySelector("input[name='payment']:checked")?.value;

    errorBox.textContent = "";

    if (!name) {
      errorBox.textContent = "Please enter your full name.";
      return null;
    }
    if (!phone || !/^09\d{9}$/.test(phone)) {
      errorBox.textContent = "Enter a valid phone number (Example: 09123456789).";
      return null;
    }
    if (!address || address.length < 10) {
      errorBox.textContent = "Please enter your complete address.";
      return null;
    }
    if (!payment) {
      errorBox.textContent = "Please select a payment method.";
      return null;
    }

    return { name, phone, address, payment };
  };

  const clearCart = async () => {
    try {
      if (currentUser?.uid) {
        await DBService.saveUserCart(currentUser.uid, []);
      }
    } catch (e) {
      console.error("Failed to clear remote cart:", e);
    }
    cartItems = [];
    localStorage.removeItem("checkout_data");
    localStorage.removeItem("chuchu_cart");
  };

  const showSuccessModal = ({ name, phone, address, payment, total }) => {
    document.getElementById("orderName").textContent = name;
    document.getElementById("orderPhone").textContent = phone;
    document.getElementById("orderAddress").textContent = address;
    document.getElementById("orderPayment").textContent = payment === "cod" ? "Cash on Delivery" : "GCash";
    document.getElementById("orderTotal").textContent = total.toFixed(2);
    successModal.style.display = "flex";
  };

  const placeOrder = async () => {
    if (!currentUser) {
      errorBox.textContent = "Please log in to place an order.";
      window.location.href = "login.html";
      return;
    }

    const formValues = validateForm();
    if (!formValues) return;

    if (!cartItems.length) {
      errorBox.textContent = "Your cart is empty.";
      return;
    }

    const { subtotal, discount, total, coupon } = getTotals();

    placeOrderBtn.disabled = true;
    try {
      await DBService.createOrder(
        currentUser.uid,
        cartItems,
        { subtotal, discount, total },
        {
          billing: {
            name: formValues.name,
            phone: formValues.phone,
            address: formValues.address
          },
          paymentMethod: formValues.payment,
          coupon,
          email: currentUser.email || null,
          shipping: "Free"
        }
      );

      await clearCart();
      showSuccessModal({
        ...formValues,
        total
      });
    } catch (e) {
      console.error("Place order failed:", e);
      errorBox.textContent = "Could not place order. Please try again.";
    } finally {
      placeOrderBtn.disabled = false;
    }
  };

  placeOrderBtn.addEventListener("click", async () => {
    await placeOrder();
  });

  document.getElementById("modalCloseBtn").addEventListener("click", () => {
    window.location.href = "shop.html"; // Redirect to shop
  });
});
