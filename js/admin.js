import { DBService } from "./services/db.js";
import { AuthService } from "./services/auth.js";

const AdminController = (() => {
  let products = [];
  let isEditMode = false;

  const init = async () => {
    // 1. Check Admin Auth
    AuthService.observeAuth(async (user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const isAdmin = await AuthService.checkAdminStatus(user);
      if (!isAdmin) {
        alert("Access Denied: Admins only.");
        window.location.href = "../index.html";
        return;
      }

      // If authorized, load data
      loadProducts();
      setupEventListeners();
    });
  };

  const loadProducts = async () => {
    products = await DBService.getAllProducts();
    renderProducts(products);
  };

  const renderProducts = (productsToRender) => {
    const tbody = document.getElementById("productTableBody");
    tbody.innerHTML = "";

    productsToRender.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.id}</td>
        <td><img src="${p.img || ''}" alt="${p.name}"></td>
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
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", (e) => openEditModal(e.target.dataset.id));
    });
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => handleDelete(e.target.dataset.id));
    });
  };

  // --- Modal Logic ---
  const modal = document.getElementById("productModal");
  const closeBtn = document.querySelector(".close");
  const form = document.getElementById("productForm");

  const setupEventListeners = () => {
    document.getElementById("addProductBtn").addEventListener("click", openAddModal);

    closeBtn.onclick = () => {
      modal.style.display = "none";
    };

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    form.addEventListener("submit", handleFormSubmit);
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

    // Find product (handle string/number mismatch)
    const product = products.find(p => String(p.id) === String(id));
    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("brand").value = product.brand;
    document.getElementById("name").value = product.name;
    document.getElementById("price").value = product.price;

    // Show current image
    if (product.img) {
      document.getElementById("imagePreview").innerHTML = `<img src="${product.img}" style="max-width: 100px;">`;
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

    try {
      const id = document.getElementById("productId").value;
      const brand = document.getElementById("brand").value;
      const name = document.getElementById("name").value;
      const price = parseFloat(document.getElementById("price").value);
      const imageFile = document.getElementById("image").files[0];

      let imgUrl = "";

      // If editing, keep old image url by default
      if (isEditMode) {
        const product = products.find(p => String(p.id) === String(id));
        imgUrl = product.img;
      }

      // If new file selected, upload it
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
        alert("Product updated!");
      } else {
        await DBService.addProduct(productData);
        alert("Product added!");
      }

      modal.style.display = "none";
      loadProducts();

    } catch (error) {
      console.error(error);
      alert("Error saving product: " + error.message);
    } finally {
      saveBtn.textContent = originalBtnText;
      saveBtn.disabled = false;
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await DBService.deleteProduct(id);
        alert("Product deleted.");
        loadProducts();
      } catch (error) {
        console.error(error);
        alert("Error deleting product: " + error.message);
      }
    }
  };

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  AdminController.init();
});
