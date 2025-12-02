import { AuthService } from "./services/auth.js";
import { DBService } from "./services/db.js";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "completed", "cancelled"];

const formatDate = (timestamp) => {
  if (!timestamp) return "–";
  try {
    const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return "–";
  }
};

const formatMoney = (value) => `$${(Number(value) || 0).toFixed(2)}`;

const buildItemsSummary = (items = []) => {
  if (!items.length) return "—";
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
            <div>${order.email || "—"}</div>
            <div class="order-subtext">${order.userId || "—"}</div>
          </td>
          <td><div class="order-subtext">${buildItemsSummary(order.items)}</div></td>
          <td>${formatMoney(order.total)}</td>
          <td>${select}</td>
          <td>${formatDate(order.createdAt)}</td>
          <td><button class="btn-outline small update-status-btn" data-path="${order.path || ""}">Update</button></td>
        </tr>
      `;
    })
    .join("");
};

const attachHandlers = () => {
  const tbody = document.querySelector("#adminOrdersTable tbody");
  if (!tbody) return;

  tbody.addEventListener("click", async (e) => {
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
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Could not update status. Check console for details.");
    } finally {
      btn.disabled = false;
    }
  });
};

const loadOrders = async () => {
  const refreshBtn = document.getElementById("refreshOrdersBtn");
  if (refreshBtn) refreshBtn.disabled = true;
  try {
    const orders = await DBService.getAllOrders();
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
});
