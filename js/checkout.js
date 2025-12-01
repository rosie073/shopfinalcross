import { DBService } from "./services/db.js";

document.addEventListener("DOMContentLoaded", () => {
  const checkoutData = JSON.parse(localStorage.getItem("checkout_data")) || {};

  const summaryBox = document.getElementById("summaryTotals");

  const subtotal = checkoutData.subtotal || 0;
  const discount = checkoutData.discount || 0;
  const total = checkoutData.total || 0;
  const coupon = checkoutData.appliedCoupon || "None";

  summaryBox.innerHTML = `
    <p>Cart Subtotal: <strong>$${subtotal.toFixed(2)}</strong></p>
    <p>Coupon Applied: <strong>${coupon}</strong></p>
    <p>Discount: <strong>-$${discount.toFixed(2)}</strong></p>
    <p>Shipping: <strong>Free</strong></p>
    <hr>
    <p><strong>Total: $${total.toFixed(2)}</strong></p>
  `;

  // Place Order
document.getElementById("placeOrderBtn").addEventListener("click", async () => {

  const name = document.getElementById("buyerName").value.trim();
  const phone = document.getElementById("buyerPhone").value.trim();
  const address = document.getElementById("buyerAddress").value.trim();
  const payment = document.querySelector("input[name='payment']:checked")?.value;

  const errorBox = document.getElementById("errorMessage");
  errorBox.textContent = "";

  // Validation
  if (!name) {
    errorBox.textContent = "Please enter your full name.";
    return;
  }
  if (!phone || !/^09\d{9}$/.test(phone)) {
    errorBox.textContent = "Enter a valid phone number (Example: 09123456789).";
    return;
  }
  if (!address || address.length < 10) {
    errorBox.textContent = "Please enter your complete address.";
    return;
  }
  if (!payment) {
    errorBox.textContent = "Please select a payment method.";
    return;
  }

  // Display modal
  document.getElementById("orderName").textContent = name;
  document.getElementById("orderPhone").textContent = phone;
  document.getElementById("orderAddress").textContent = address;
  document.getElementById("orderPayment").textContent =
    payment === "cod" ? "Cash on Delivery" : "GCash";
  document.getElementById("orderTotal").textContent = total.toFixed(2);

  document.getElementById("orderSuccessModal").style.display = "flex";
});

// Close modal
document.getElementById("modalCloseBtn").addEventListener("click", () => {
  window.location.href = "shop.html"; // Redirect to shop
});


});
