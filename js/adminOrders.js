import { AuthService } from "./services/auth.js";
import { DBService } from "./services/db.js";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"];

const state = {
  orders: [],
  activePath: null
};

const modalEls = {
  modal: null,
  id: null,
  date: null,
  customer: null,
  email: null,
  phone: null,
  address: null,
  payment: null,
  subtotal: null,
  discount: null,
  total: null,
  items: null,
  statusSelect: null,
  saveBtn: null,
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

const buildItemsSummary = (items = []) => {
  if (!items.length) return "N/A";
  return items
    .map((item) => {
      const qty = Number(item.qty) || 0;
      return `${item.name || "Item"} x${qty}`;
    })
    .join(", ");
};

const renderTable = (orders) => {
  const tbody = document.querySelector("#adminOrdersTable tbody");
  const empty = document.getElementById("adminOrdersEmpty");
  if (!tbody || !empty) return;

  if (!orders.length) {
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";
  tbody.innerHTML = orders
    .map((order) => {
      const select = `
        <select class="order-status-select" data-path="${order.path || ""}">
          ${STATUS_OPTIONS.map((opt) => `<option value="${opt}" ${opt === (order.status || "pending") ? "selected" : ""}>${opt}</option>`).join("")}
        </select>
      `;
      return `
        <tr>
          <td>
            <div class="order-id">#${order.id}</div>
            <div class="order-date">${formatDate(order.createdAt)}</div>
          </td>
          <td>
            <div>${order.email || "N/A"}</div>
            <div class="order-subtext">${order.userId || "N/A"}</div>
          </td>
          <td><div class="order-subtext">${buildItemsSummary(order.items)}</div></td>
          <td>${formatMoney(order.total)}</td>
          <td>${select}</td>
          <td>${formatDate(order.createdAt)}</td>
          <td>
            <div class="actions-cell">
              <button class="btn-outline small view-order-btn" data-path="${order.path || ""}">View</button>
              <button class="btn-outline small update-status-btn" data-path="${order.path || ""}">Update</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
};

const closeModal = () => {
  if (!modalEls.modal) return;
  modalEls.modal.classList.remove("open");
  modalEls.modal.setAttribute("aria-hidden", "true");
  state.activePath = null;
};

const getOrderByPath = (path) => state.orders.find((o) => o.path === path);

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
            <div class="order-modal__item-meta">Qty: ${qty} • $${price.toFixed(2)} each</div>
          </div>
          <div class="order-modal__item-total">${formatMoney(total)}</div>
        </div>
      `;
    })
    .join("");
};

const populateStatusSelect = (current = "pending") => {
  if (!modalEls.statusSelect) return;
  modalEls.statusSelect.innerHTML = STATUS_OPTIONS.map(
    (opt) => `<option value="${opt}" ${opt === (current || "pending") ? "selected" : ""}>${opt}</option>`
  ).join("");
};

const openModal = (order) => {
  if (!order || !modalEls.modal) return;
  state.activePath = order.path;

  modalEls.id.textContent = `#${order.id}`;
  modalEls.date.textContent = formatDate(order.createdAt);
  modalEls.customer.textContent = order.billing?.name || order.userId || "N/A";
  modalEls.email.textContent = order.email || "No email";
  modalEls.phone.textContent = order.billing?.phone || "No phone";
  modalEls.address.textContent = order.billing?.address || "No address provided";
  modalEls.payment.textContent =
    order.paymentMethod === "cod"
      ? "Cash on Delivery"
      : order.paymentMethod
        ? order.paymentMethod
        : "No payment method";
  modalEls.subtotal.textContent = `Subtotal: ${formatMoney(order.subtotal ?? order.total)}`;
  modalEls.discount.textContent = `Discount: ${formatMoney(order.discount || 0)}`;
  modalEls.total.textContent = `Total: ${formatMoney(order.total ?? order.subtotal)}`;
  renderModalItems(order.items || []);
  populateStatusSelect(order.status);

  modalEls.modal.classList.add("open");
  modalEls.modal.setAttribute("aria-hidden", "false");
};

const attachHandlers = () => {
  const tbody = document.querySelector("#adminOrdersTable tbody");
  if (!tbody) return;

  tbody.addEventListener("click", async (e) => {
    const viewBtn = e.target.closest(".view-order-btn");
    if (viewBtn) {
      const order = getOrderByPath(viewBtn.dataset.path);
      if (order) openModal(order);
      return;
    }

    const btn = e.target.closest(".update-status-btn");
    if (!btn) return;
    const path = btn.dataset.path;
    const select = tbody.querySelector(`select.order-status-select[data-path="${path}"]`);
    const status = select?.value;
    if (!path || !status) return;

    btn.disabled = true;
    try {
      await DBService.updateOrderStatus(path, status);
      btn.textContent = "Saved";
      setTimeout(() => (btn.textContent = "Update"), 1200);

      const order = getOrderByPath(path);
      if (order) order.status = status;
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Could not update status. Check console for details.");
    } finally {
      btn.disabled = false;
    }
  });
};

const attachModalHandlers = () => {
  modalEls.modal = document.getElementById("orderDetailModal");
  modalEls.id = document.getElementById("orderModalId");
  modalEls.date = document.getElementById("orderModalDate");
  modalEls.customer = document.getElementById("orderModalCustomer");
  modalEls.email = document.getElementById("orderModalEmail");
  modalEls.phone = document.getElementById("orderModalPhone");
  modalEls.address = document.getElementById("orderModalAddress");
  modalEls.payment = document.getElementById("orderModalPayment");
  modalEls.subtotal = document.getElementById("orderModalSubtotal");
  modalEls.discount = document.getElementById("orderModalDiscount");
  modalEls.total = document.getElementById("orderModalTotal");
  modalEls.items = document.getElementById("orderModalItems");
  modalEls.statusSelect = document.getElementById("orderModalStatus");
  modalEls.saveBtn = document.getElementById("orderModalSave");
  modalEls.closeBtns = [
    document.getElementById("orderModalClose"),
    document.getElementById("orderModalCloseFooter")
  ].filter(Boolean);

  if (!modalEls.modal) return;

  modalEls.modal.addEventListener("click", (e) => {
    if (e.target === modalEls.modal) {
      closeModal();
    }
  });

  modalEls.closeBtns.forEach((btn) => btn.addEventListener("click", closeModal));

  if (modalEls.saveBtn) {
    modalEls.saveBtn.addEventListener("click", async () => {
      const path = state.activePath;
      if (!path || !modalEls.statusSelect) return;
      const newStatus = modalEls.statusSelect.value;
      modalEls.saveBtn.disabled = true;
      modalEls.saveBtn.textContent = "Saving...";
      try {
        await DBService.updateOrderStatus(path, newStatus);

        const order = getOrderByPath(path);
        if (order) order.status = newStatus;

        const select = document.querySelector(`select.order-status-select[data-path="${path}"]`);
        if (select) select.value = newStatus;

        modalEls.saveBtn.textContent = "Saved";
        setTimeout(() => {
          modalEls.saveBtn.textContent = "Update Status";
        }, 1200);
      } catch (err) {
        console.error("Failed to update order status:", err);
        alert("Could not update status. Check console for details.");
      } finally {
        modalEls.saveBtn.disabled = false;
      }
    });
  }
};

const loadOrders = async () => {
  const refreshBtn = document.getElementById("refreshOrdersBtn");
  if (refreshBtn) refreshBtn.disabled = true;
  try {
    const orders = await DBService.getAllOrders();
    state.orders = orders;
    renderTable(orders);
  } catch (e) {
    console.error("Failed to load orders:", e);
    alert("Could not load orders. Please retry.");
  } finally {
    if (refreshBtn) refreshBtn.disabled = false;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  AuthService.observeAuth(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    // Force-refresh token to ensure latest custom claims
    const tokenResult = await user.getIdTokenResult(true);
    console.log("claims:", tokenResult.claims);
    const hasAdminClaim = !!tokenResult.claims.admin || !!tokenResult.claims.isAdmin;

    // Also use the fallback check and log the result for visibility
    const adminStatusFromDb = await AuthService.checkAdminStatus(user);
    console.log("checkAdminStatus(user) =>", adminStatusFromDb);

    const isAdmin = hasAdminClaim || adminStatusFromDb;
    if (!isAdmin) {
      window.location.href = "login.html";
      return;
    }
    loadOrders();
  });

  const refreshBtn = document.getElementById("refreshOrdersBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", loadOrders);

  attachHandlers();
  attachModalHandlers();
});
