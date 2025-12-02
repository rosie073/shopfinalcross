import { AuthService } from "./services/auth.js";
import { DBService } from "./services/db.js";

const HISTORY_STATUSES = ["delivered", "completed", "cancelled"];

const formatDate = (timestamp) => {
  if (!timestamp) return "–";
  try {
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return "–";
  }
};

const formatMoney = (value) => {
  const n = Number(value) || 0;
  return `$${n.toFixed(2)}`;
};

const statusClass = (status) => {
  const key = (status || "pending").toLowerCase();
  if (key === "delivered" || key === "completed") return "status-complete";
  if (key === "cancelled") return "status-cancelled";
  if (key === "processing" || key === "shipped") return "status-progress";
  return "status-pending";
};

const buildItemsList = (items = []) => {
  if (!items.length) return "<div class=\"order-items\">No items found.</div>";
  const list = items
    .map((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      return `
        <div class="order-item">
          <div>
            <p class="order-item-name">${item.name || "Item"}</p>
            <p class="order-item-meta">Qty: ${qty} · ${formatMoney(price)}</p>
          </div>
          <p class="order-item-total">${formatMoney(price * qty)}</p>
        </div>
      `;
    })
    .join("");
  return `<div class="order-items">${list}</div>`;
};

const orderCard = (order) => {
  const status = (order.status || "pending").toLowerCase();
  const { subtotal = 0, total = 0, coupon = "None", discount = 0, shipping = "Free" } = order;
  const payment =
    order.paymentMethod === "gcash" ? "GCash" : order.paymentMethod === "cod" ? "Cash on Delivery" : "—";

  return `
    <article class="order-card">
      <div class="order-card-top">
        <div>
          <p class="order-id">Order #${order.id || "–"}</p>
          <p class="order-date">${formatDate(order.createdAt)}</p>
        </div>
        <span class="order-status ${statusClass(status)}">${status}</span>
      </div>

      ${buildItemsList(order.items)}

      <div class="order-meta">
        <div>
          <p class="meta-label">Payment</p>
          <p class="meta-value">${payment}</p>
        </div>
        <div>
          <p class="meta-label">Coupon</p>
          <p class="meta-value">${coupon || "None"}</p>
        </div>
        <div>
          <p class="meta-label">Shipping</p>
          <p class="meta-value">${shipping}</p>
        </div>
      </div>

      <div class="order-totals">
        <div><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
        <div><span>Discount</span><span>${formatMoney(discount || 0)}</span></div>
        <div class="order-total-row"><strong>Total</strong><strong>${formatMoney(total)}</strong></div>
      </div>
    </article>
  `;
};

const renderOrders = (orders, activeContainer, historyContainer) => {
  const active = [];
  const history = [];

  orders.forEach((order) => {
    const status = (order.status || "pending").toLowerCase();
    if (HISTORY_STATUSES.includes(status)) {
      history.push(order);
    } else {
      active.push(order);
    }
  });

  const renderList = (list, container, emptyText) => {
    if (!container) return;
    if (!list.length) {
      container.innerHTML = `<div class="orders-empty">${emptyText}</div>`;
      return;
    }
    container.innerHTML = list.map(orderCard).join("");
  };

  renderList(active, activeContainer, "No current orders yet.");
  renderList(history, historyContainer, "No past orders yet.");
};

document.addEventListener("DOMContentLoaded", () => {
  const activeContainer = document.getElementById("activeOrders");
  const historyContainer = document.getElementById("orderHistory");

  const showLoading = () => {
    if (activeContainer) activeContainer.innerHTML = '<div class="orders-empty">Loading...</div>';
    if (historyContainer) historyContainer.innerHTML = "";
  };

  const loadOrders = async (user) => {
    showLoading();
    const orders = await DBService.getUserOrders(user.uid);
    renderOrders(orders, activeContainer, historyContainer);
  };

  AuthService.observeAuth((user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    loadOrders(user);
  });
});
