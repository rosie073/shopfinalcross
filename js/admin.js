import { DBService } from "./services/db.js";
import { AuthService } from "./services/auth.js";
import { ProductModel } from "./models/productModels.js";

/* ---------------------------
   UI HELPERS (Toast + Confirm)
---------------------------- */

// Simple toast notification
const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  // Basic inline fallback styling so it still looks okay without extra CSS
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.zIndex = "2000";
  toast.style.padding = "10px 16px";
  toast.style.borderRadius = "6px";
  toast.style.fontSize = "14px";
  toast.style.color = "#fff";
  toast.style.backgroundColor = type === "error" ? "#e74c3c" : "#088178";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(8px)";
  toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 250);
  }, 2200);
};

// Custom confirm dialog (returns Promise<boolean>)
const showConfirmDialog = (title, message) => {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "1900"
    });

    const box = document.createElement("div");
    box.className = "confirm-box";
    Object.assign(box.style, {
      background: "#fff",
      borderRadius: "10px",
      padding: "20px 22px",
      maxWidth: "340px",
      width: "90%",
      boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
      fontFamily: "inherit"
    });

    box.innerHTML = `
      <h3 style="margin:0 0 8px; font-size:18px;">${title}</h3>
      <p style="margin:0 0 18px; font-size:14px; color:#555;">${message}</p>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button type="button" data-action="cancel" style="
          border:1px solid #ddd; 
          background:#fff;
          padding:6px 14px;
          border-radius:6px;
          font-size:14px;
          cursor:pointer;
        ">Cancel</button>
        <button type="button" data-action="confirm" style="
          border:none;
          background:#e74c3c;
          color:#fff;
          padding:6px 14px;
          border-radius:6px;
          font-size:14px;
          cursor:pointer;
        ">Delete</button>
      </div>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const cleanup = () => overlay.remove();

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    });

    const cancelBtn = box.querySelector('[data-action="cancel"]');
    const confirmBtn = box.querySelector('[data-action="confirm"]');

    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(false);
    });

    confirmBtn.addEventListener("click", () => {
      cleanup();
      resolve(true);
    });
  });
};

/* ---------------------------
   ADMIN CONTROLLER
---------------------------- */

const AdminController = (() => {
  let products = [];
  let isEditMode = false;

  const init = async () => {
    AuthService.observeAuth(async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const isAdmin = await AuthService.checkAdminStatus(user);
      if (!isAdmin) {
        showToast("Access denied: Admins only.", "error");
        window.location.href = "../index.html";
        return;
      }

      // If authorized, load data
      await loadProducts();
      setupEventListeners();
    });
  };

  const loadProducts = async () => {
    try {
      products = await ProductModel.getProducts();
      renderProducts(products);
    } catch (err) {
      console.error("Failed to load products:", err);
      showToast("Error loading products", "error");
    }
  };

  const renderProducts = (productsToRender) => {
    const tbody = document.getElementById("productTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    productsToRender.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td><img src="${p.img || ""}" alt="${p.name}" /></td>
        <td>${p.brand}</td>
        <td>${p.name}</td>
        <td>$${p.price}</td>
        <td>
          <button class="action-btn edit-btn" data-id="${p.id}">Edit</button>
          <button class="action-btn delete-btn" data-id="${p.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Attach event listeners to buttons
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        openEditModal(e.currentTarget.dataset.id)
      );
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        handleDelete(e.currentTarget.dataset.id)
      );
    });
  };

  // --- Modal Logic ---
  const modal = document.getElementById("productModal");
  const closeBtn = document.querySelector(".close");
  const form = document.getElementById("productForm");

  const setupEventListeners = () => {
    // Add Product button with small click feedback
    const addBtn = document.getElementById("addProductBtn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        addBtn.classList.add("btn-clicked");
        setTimeout(() => addBtn.classList.remove("btn-clicked"), 120);
        openAddModal();
      });
    }

    // Optional Refresh button (if you add one in HTML with this id)
    const refreshBtn = document.getElementById("refreshProductsBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", async () => {
        const originalText = refreshBtn.textContent;
        refreshBtn.disabled = true;
        refreshBtn.textContent = "Refreshing...";
        refreshBtn.classList.add("btn-loading");
        await loadProducts();
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
        refreshBtn.classList.remove("btn-loading");
      });
    }

    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = "none";
      };
    }

    window.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    };

    if (form) {
      form.addEventListener("submit", handleFormSubmit);
    }
  };

  const openAddModal = () => {
    isEditMode = false;
    document.getElementById("modalTitle").textContent = "Add Product";
    form.reset();
    document.getElementById("productId").value = "";
    document.getElementById("imagePreview").innerHTML = "";
    modal.style.display = "block";
  };

  const openEditModal = (id) => {
    isEditMode = true;
    document.getElementById("modalTitle").textContent = "Edit Product";

    const product = products.find((p) => String(p.id) === String(id));
    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("brand").value = product.brand;
    document.getElementById("name").value = product.name;
    document.getElementById("price").value = product.price;

    if (product.img) {
      document.getElementById(
        "imagePreview"
      ).innerHTML = `<img src="${product.img}" style="max-width: 100px;">`;
    } else {
      document.getElementById("imagePreview").innerHTML = "";
    }

    modal.style.display = "block";
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById("saveProductBtn");
    const originalBtnText = saveBtn.textContent;

    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;
    saveBtn.classList.add("btn-loading");

    try {
      const id = document.getElementById("productId").value;
      const brand = document.getElementById("brand").value;
      const name = document.getElementById("name").value;
      const price = parseFloat(document.getElementById("price").value);
      const imageFile = document.getElementById("image").files[0];

      let imgUrl = "";

      if (isEditMode) {
        const product = products.find((p) => String(p.id) === String(id));
        imgUrl = product?.img || "";
      }

      if (imageFile) {
        imgUrl = await DBService.uploadProductImage(imageFile);
      }

      const productData = {
        brand,
        name,
        price,
        img: imgUrl
      };

      if (isEditMode) {
        await DBService.updateProduct(id, productData);
        showToast("Product updated successfully");
      } else {
        await DBService.addProduct(productData);
        showToast("Product added successfully");
      }

      modal.style.display = "none";
      ProductModel.invalidateCache();
      await loadProducts();
    } catch (error) {
      console.error(error);
      showToast("Error saving product", "error");
    } finally {
      saveBtn.textContent = originalBtnText;
      saveBtn.disabled = false;
      saveBtn.classList.remove("btn-loading");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirmDialog(
      "Delete Product?",
      "This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await DBService.deleteProduct(id);
      showToast("Product deleted");
      ProductModel.invalidateCache();
      await loadProducts();
    } catch (error) {
      console.error(error);
      showToast("Error deleting product", "error");
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  AdminController.init();
});
