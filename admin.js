const url = "https://art-frenzy-admin-6.onrender.com"; // Backend URL

// DOM elements
const imageInput = document.querySelector("#product-image");
const uploadBtn = document.querySelector("#upload-btn");
const addProductBtn = document.querySelector("#add-product-btn");
const productsContainer = document.getElementById("products");
const logList = document.getElementById("log-list");

let uploadedImageUrl = "";
let editingProductId = null;

// Logging
function addLog(message) {
  const li = document.createElement("li");
  li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logList.appendChild(li);
  logList.scrollTop = logList.scrollHeight;
}

// Helper: format image URL safely
function formatImageUrl(path) {
  if (!path) return "https://via.placeholder.com/250x250?text=No+Image";
  return `${url}/uploads/${encodeURIComponent(path.replace(/\\/g, '/'))}`;
}

// ---------------- Upload Image ----------------
uploadBtn.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) return addLog("❌ Select an image first!");

  const formData = new FormData();
  formData.append("image", file);
  addLog("⏳ Uploading image...");

  try {
    const res = await fetch(`${url}/upload-image`, { method: "POST", body: formData });
    const data = await res.json();
    if (data.error) return addLog("❌ Upload failed: " + data.error);

    uploadedImageUrl = data.image_url.replace(/\\/g, '/');
    addLog("✅ Image uploaded successfully: " + uploadedImageUrl);
  } catch (err) {
    addLog("❌ Upload failed: " + err);
  }
});

// ---------------- Add / Update Product ----------------
addProductBtn.addEventListener("click", async () => {
  const title = document.querySelector("#product-title").value.trim();
  const price = document.querySelector("#product-price").value.trim();
  const stock = document.querySelector("#product-stock").value.trim();

  if (!title || !price || !stock || !uploadedImageUrl) {
    addLog("❌ Fill all fields and upload image!");
    return;
  }

  const endpoint = editingProductId
    ? `${url}/update-product/${editingProductId}`
    : `${url}/add-product`;
  const method = editingProductId ? "PUT" : "POST";

  addLog(editingProductId ? "⏳ Updating product..." : "⏳ Adding product...");

  try {
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, price, stock, image_url: uploadedImageUrl })
    });
    const data = await res.json();
    if (data.error) return addLog("❌ Failed: " + data.error);

    addLog(editingProductId
      ? `✅ Product updated successfully: ${data.product.title}`
      : `✅ Product added successfully: ${data.product.title}`);

    // Clear form
    document.querySelector("#product-title").value = "";
    document.querySelector("#product-price").value = "";
    document.querySelector("#product-stock").value = "";
    imageInput.value = "";
    uploadedImageUrl = "";
    editingProductId = null;
    addProductBtn.textContent = "Add Product";

    loadProducts();
  } catch (err) {
    addLog("❌ Failed: " + err);
  }
});

// ---------------- Load Products ----------------
async function loadProducts() {
  addLog("⏳ Loading products...");
  productsContainer.innerHTML = "<p style='text-align:center;'>Loading...</p>";

  try {
    const res = await fetch(`${url}/products`);
    const products = await res.json();

    productsContainer.innerHTML = "";

    if (!products.length) {
      productsContainer.innerHTML = "<p>No products found.</p>";
      addLog("⚠️ No products found.");
      return;
    }

    products.forEach((p) => {
      const stock = parseInt(p.stock) || 0;
      const imgSrc = formatImageUrl(p.image_url);

      const card = document.createElement("div");
      card.className = "product-card";
      card.style.border = "1px solid #ccc";
      card.style.borderRadius = "10px";
      card.style.padding = "1rem";
      card.style.margin = "1rem";
      card.style.textAlign = "center";
      card.style.maxWidth = "280px";
      card.style.flex = "1 1 250px";

      card.innerHTML = `
        ${stock === 0 ? '<div style="color:red;font-weight:bold;">Sold Out</div>' : ''}
        <img src="${imgSrc}" alt="${p.title}" style="width:100%; height:auto; border-radius:8px;"/>
        <h3>${p.title}</h3>
        <p>Price: $${p.price}</p>
        <p>Stock: ${stock}</p>
        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
          <button class="edit-btn" data-id="${p.id}">Edit</button>
          <button class="delete-btn" data-id="${p.id}">Delete</button>
        </div>
      `;

      productsContainer.appendChild(card);

      // Edit product
      card.querySelector(".edit-btn").addEventListener("click", () => {
        document.querySelector("#product-title").value = p.title;
        document.querySelector("#product-price").value = p.price;
        document.querySelector("#product-stock").value = p.stock;
        uploadedImageUrl = p.image_url.replace(/\\/g, '/');
        editingProductId = p.id;
        addProductBtn.textContent = "Update Product";
        addLog(`✏️ Editing product: ${p.title}`);
      });

      // Delete product
      card.querySelector(".delete-btn").addEventListener("click", async () => {
        if (!confirm(`Are you sure you want to delete "${p.title}"?`)) return;
        try {
          const res = await fetch(`${url}/delete-product/${p.id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.error) return addLog("❌ Delete failed: " + data.error);
          addLog(`🗑️ Product deleted: ${p.title}`);
          loadProducts();
        } catch (err) {
          addLog("❌ Delete failed: " + err);
        }
      });
    });

    // Flex container styling
    productsContainer.style.display = "flex";
    productsContainer.style.flexWrap = "wrap";
    productsContainer.style.justifyContent = "center";

    addLog(`✅ Loaded ${products.length} products successfully.`);
  } catch (err) {
    addLog("❌ Failed to load products: " + err);
    productsContainer.innerHTML = "<p>Error loading products. Check logs above.</p>";
  }
}

window.addEventListener("DOMContentLoaded", loadProducts);
