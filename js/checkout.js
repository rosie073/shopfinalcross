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
    const payment = document.getElementById("paymentMethod").value;

    if (!name || !phone || !address) {
      alert("Please complete your information.");
      return;
    }

    alert(`
Order placed successfully!

Name: ${name}
Phone: ${phone}
Address: ${address}
Payment: ${payment === "cod" ? "Cash on Delivery" : "GCash"}
Total: $${total.toFixed(2)}
    `);

    // TODO: Save order to DB if needed
  });
});
