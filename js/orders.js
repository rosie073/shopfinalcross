import { AuthService } from "./services/auth.js";
import { DBService } from "./services/db.js";

const HISTORY_STATUSES = ["delivered", "completed", "cancelled"];

const state = {
  orders: []
};

const modalEls = {
  modal: null,
  id: null,
  date: null,
  status: null,
  customer: null,
  email: null,
  phone: null,
  address: null,
  payment: null,
  subtotal: null,
  discount: null,
  total: null,
  items: null,
  closeBtns: []
};

const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return "N/A";
  }
};

const formatMoney = (value) => `$${(Number(value) || 0).toFixed(2)}`;

const statusClass = (status) => {
  const key = (status || "pending").toLowerCase();
  if (key === "delivered" || key === "completed") return "status-complete";
  if (key === "cancelled") return "status-cancelled";
  if (key === "processing" || key === "shipped") return "status-progress";
  return "status-pending";
};

const getPaymentLabel = (order) => {
  const method = (order.paymentMethod || "").toLowerCase();
  if (method === "gcash") return "GCash";
  if (method === "cod") return "Cash on Delivery";
  if (method) return method;
  return "Not specified";
};

const orderKey = (order, idx) => order.path || order.id || `order-${idx}`;

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
            <p class="order-item-meta">Qty: ${qty} • ${formatMoney(price)}</p>
          </div>
          <p class="order-item-total">${formatMoney(price * qty)}</p>
        </div>
      `;
    })
    .join("");
  return `<div class="order-items">${list}</div>`;
};

const renderModalItems = (items = []) => {
  if (!modalEls.items) return;
  if (!items.length) {
    modalEls.items.innerHTML = `<div class="order-modal__muted">No items found for this order.</div>`;
    return;
  }

  modalEls.items.innerHTML = items
    .map((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const total = qty * price;
      return `
        <div class="order-modal__item">
          <img src="${item.img || "../img/logo.png"}" alt="${item.name || "Product"}">
          <div>
            <div class="order-modal__item-title">${item.name || "Item"}</div>
            <div class="order-modal__item-meta">Qty: ${qty} • ${formatMoney(price)}</div>
          </div>
          <div class="order-modal__item-total">${formatMoney(total)}</div>
        </div>
      `;
    })
    .join("");
};

const orderCard = (order) => {
  const status = (order.status || "pending").toLowerCase();
  const { subtotal = 0, total = 0, coupon = "None", discount = 0, shipping = "Free" } = order;
  const payment = getPaymentLabel(order);

  return `
    <article class="order-card">
      <div class="order-card-top">
        <div>
          <p class="order-id">Order #${order.id || "N/A"}</p>
          <p class="order-date">${formatDate(order.createdAt)}</p>
        </div>
        <div class="order-card-actions">
          <span class="order-status ${statusClass(status)}">${status}</span>
          <button class="btn-outline small view-order-btn" data-key="${order._key}">View</button>
        </div>
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

const closeModal = () => {
  if (!modalEls.modal) return;
  modalEls.modal.classList.remove("open");
  modalEls.modal.setAttribute("aria-hidden", "true");
};

const openModal = (order) => {
  if (!modalEls.modal) return;

  modalEls.id.textContent = `#${order.id || "N/A"}`;
  modalEls.date.textContent = formatDate(order.createdAt);

  const statusText = (order.status || "pending").toLowerCase();
  modalEls.status.textContent = statusText;
  modalEls.status.className = `order-status ${statusClass(statusText)}`;

  modalEls.customer.textContent = order.billing?.name || order.userId || "No name provided";
  modalEls.email.textContent = order.email || "No email";
  modalEls.phone.textContent = order.billing?.phone || "No phone";
  modalEls.address.textContent = order.billing?.address || "No address provided";
  modalEls.payment.textContent = getPaymentLabel(order);

  modalEls.subtotal.textContent = `Subtotal: ${formatMoney(order.subtotal ?? order.total)}`;
  modalEls.discount.textContent = `Discount: ${formatMoney(order.discount || 0)}`;
  modalEls.total.textContent = `Total: ${formatMoney(order.total ?? order.subtotal)}`;

  renderModalItems(order.items || []);

  modalEls.modal.classList.add("open");
  modalEls.modal.setAttribute("aria-hidden", "false");
};

const setupModal = () => {
  modalEls.modal = document.getElementById("orderDetailModal");
  modalEls.id = document.getElementById("orderModalId");
  modalEls.date = document.getElementById("orderModalDate");
  modalEls.status = document.getElementById("orderModalStatus");
  modalEls.customer = document.getElementById("orderModalCustomer");
  modalEls.email = document.getElementById("orderModalEmail");
  modalEls.phone = document.getElementById("orderModalPhone");
  modalEls.address = document.getElementById("orderModalAddress");
  modalEls.payment = document.getElementById("orderModalPayment");
  modalEls.subtotal = document.getElementById("orderModalSubtotal");
  modalEls.discount = document.getElementById("orderModalDiscount");
  modalEls.total = document.getElementById("orderModalTotal");
  modalEls.items = document.getElementById("orderModalItems");
  modalEls.closeBtns = [
    document.getElementById("orderModalClose"),
    document.getElementById("orderModalCloseFooter")
  ].filter(Boolean);

  if (!modalEls.modal) return;

  modalEls.modal.addEventListener("click", (e) => {
    if (e.target === modalEls.modal) closeModal();
  });

  modalEls.closeBtns.forEach((btn) => btn.addEventListener("click", closeModal));
};

document.addEventListener("DOMContentLoaded", () => {
  const activeContainer = document.getElementById("activeOrders");
  const historyContainer = document.getElementById("orderHistory");

  setupModal();

  const showLoading = () => {
    if (activeContainer) activeContainer.innerHTML = '<div class="orders-empty">Loading...</div>';
    if (historyContainer) historyContainer.innerHTML = "";
  };

  const findOrder = (key) => state.orders.find((o) => o._key === key);

  const attachViewHandler = () => {
    [activeContainer, historyContainer].forEach((container) => {
      if (!container) return;
      container.addEventListener("click", (e) => {
        const btn = e.target.closest(".view-order-btn");
        if (!btn) return;
        const order = findOrder(btn.dataset.key);
        if (order) openModal(order);
      });
    });
  };

  const loadOrders = async (user) => {
    showLoading();
    const orders = await DBService.getUserOrders(user.uid);
    state.orders = (orders || []).map((order, idx) => ({
      ...order,
      _key: orderKey(order, idx)
    }));
    renderOrders(state.orders, activeContainer, historyContainer);
  };

  attachViewHandler();

  AuthService.observeAuth((user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    loadOrders(user);
  });
});
