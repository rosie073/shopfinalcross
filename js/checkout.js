import { DBService } from "./services/db.js";
import { AuthService } from "./services/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const summaryBox = document.getElementById("summaryTotals");
  const errorBox = document.getElementById("errorMessage");
  const successModal = document.getElementById("orderSuccessModal");
  const placeOrderBtn = document.getElementById("placeOrderBtn");

  console.log("[checkout] DOM ready. Button found:", !!placeOrderBtn);
  if (!placeOrderBtn) {
    console.error("[checkout] Cannot bind place order handler because button is missing.");
    return;
  }

  let checkoutData = JSON.parse(localStorage.getItem("checkout_data")) || {};
  let cartItems = [];
  let currentUser = null;

  console.log("[checkout] Loaded checkout_data from localStorage:", checkoutData);

  const showAlert = (title, text = "", icon = "warning") => {
    if (window.Swal?.fire) {
      window.Swal.fire({ title, text, icon });
    } else if (typeof window.swal === "function") {
      window.swal(title, text, icon);
    } else {
      alert(text ? `${title}: ${text}` : title);
    }
  };

  const showAdminBlocked = () => {
    showAlert("Admins cannot place orders", "Switch to a customer account to checkout.");
  };

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
      console.log("[checkout] Loading cart for user:", user.uid);
      const items = await DBService.getUserCart(user.uid);
      cartItems = items || [];
      console.log("[checkout] Cart items loaded:", cartItems.length);
      renderSummary();
    } catch (e) {
      console.error("Failed to load cart for checkout:", e);
      cartItems = [];
    }
  };

  AuthService.observeAuth(async (user) => {
    console.log("[checkout] observeAuth fired. User:", user?.uid);
    currentUser = user;
    if (!user) {
      console.warn("[checkout] No user. Redirecting to login.");
      window.location.href = "login.html";
      return;
    }
    await loadCart(user);
  });

  renderSummary();

  const validateForm = () => {
    const nameInput = document.getElementById("buyerName");
    const phoneInput = document.getElementById("buyerPhone");
    const addressInput = document.getElementById("buyerAddress");
    const paymentInput = document.querySelector("input[name='payment']:checked");
    const name = nameInput?.value.trim() || "";
    const phone = phoneInput?.value.trim() || "";
    const address = addressInput?.value.trim() || "";
    const payment = paymentInput?.value;

    const clearErrors = () => {
      [nameInput, phoneInput, addressInput].forEach((el) => el?.classList.remove("input-error"));
    };

    const flagError = (el) => {
      if (el) {
        el.classList.add("input-error");
        el.focus();
      }
    };

    errorBox.textContent = "";
    clearErrors();

    if (!name) {
      console.warn("[checkout] Validation failed: name missing");
      errorBox.textContent = "Please enter your full name.";
      showAlert("Full name required");
      flagError(nameInput);
      return null;
    }
    if (!phone || !/^09\d{9}$/.test(phone)) {
      console.warn("[checkout] Validation failed: phone invalid", phone);
      errorBox.textContent = "Enter a valid phone number (Example: 09123456789).";
      showAlert("Invalid phone number", "Use format 09123456789");
      flagError(phoneInput);
      return null;
    }
    if (!address || address.length < 10) {
      console.warn("[checkout] Validation failed: address too short");
      errorBox.textContent = "Please enter your complete address.";
      showAlert("Address too short", "Please enter your complete address.");
      flagError(addressInput);
      return null;
    }
    if (!payment) {
      console.warn("[checkout] Validation failed: payment not selected");
      errorBox.textContent = "Please select a payment method.";
      showAlert("Select a payment method");
      return null;
    }

    console.log("[checkout] Validation passed.");
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
    console.log("[checkout] placeOrder clicked. User:", currentUser?.uid, "cartItems:", cartItems.length);
    if (window.isAdminUser || document.body.classList.contains("admin-user")) {
      console.warn("[checkout] Blocked placeOrder: admin user.");
      showAdminBlocked();
      return;
    }
    if (!currentUser) {
      errorBox.textContent = "Please log in to place an order.";
      console.warn("[checkout] Blocked placeOrder: no user");
      showAlert("Login required", "Please log in to place an order.");
      window.location.href = "login.html";
      return;
    }

    const formValues = validateForm();
    if (!formValues) return;

    if (!cartItems.length) {
      errorBox.textContent = "Your cart is empty.";
      console.warn("[checkout] Blocked placeOrder: cart is empty.");
      showAlert("Cart is empty", "Add items before checking out.");
      return;
    }

    const { subtotal, discount, total, coupon } = getTotals();
    console.log("[checkout] Proceeding to create order with totals:", { subtotal, discount, total, coupon });

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
      console.log("[checkout] Order created and cart cleared.");
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
