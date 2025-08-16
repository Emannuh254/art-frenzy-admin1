const API_BASE = "https://art-frenzy-admin.onrender.com";

const productsContainer = document.getElementById("products");
const purchasesContainer = document.getElementById("purchases");
const form = document.getElementById("productForm");
const toast = document.getElementById("toast");

let uploadedImageUrl = "";
let uploadedThumbUrl = "";

// Toast
function showToast(msg) {
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// Upload image immediately
document.getElementById("image").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
    const data = await res.json();
    uploadedImageUrl = data.url;
    uploadedThumbUrl = data.thumbnail_url;
    showToast("Image uploaded!");
  } catch {
    showToast("Upload failed.");
  }
});

// Submit product
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;
  const stock = document.getElementById("stock").value;

  try {
    await fetch(`${API_BASE}/admin/add-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title, price, stock,
        image_url: uploadedImageUrl,
        thumb_url: uploadedThumbUrl
      }),
    });

    showToast("Product added!");
    form.reset();
    uploadedImageUrl = uploadedThumbUrl = "";
    loadProducts();
  } catch {
    showToast("Failed to add product.");
  }
});

// Load products
async function loadProducts() {
  productsContainer.innerHTML = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/admin/products`);
    const products = await res.json();

    productsContainer.innerHTML = "";
    products.forEach((p) => {
      const div = document.createElement("div");
      div.className = "product-card";
      div.innerHTML = `
        <img src="${p.thumb_url}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p>Price: $${p.price}</p>
        <p>Stock: ${p.stock}</p>
        <button data-id="${p.id}">Delete</button>
      `;
      div.querySelector("button").addEventListener("click", () => deleteProduct(p.id));
      productsContainer.appendChild(div);
    });
  } catch {
    productsContainer.innerHTML = "Failed to load products.";
  }
}

// Load purchases
async function loadPurchases() {
  purchasesContainer.innerHTML = "Loading...";
  try {
    const res = await fetch(`${API_BASE}/admin/purchases`);
    const purchases = await res.json();

    purchasesContainer.innerHTML = "";
    purchases.forEach((p) => {
      const div = document.createElement("div");
      div.className = "purchase-item";
      div.innerHTML = `
        <p><strong>${p.buyer_name}</strong> (${p.buyer_phone})</p>
        <p>Location: ${p.drop_location}</p>
        <p>Product ID: ${p.product_id} — Txn: ${p.transaction_id}</p>
      `;
      purchasesContainer.appendChild(div);
    });
  } catch {
    purchasesContainer.innerHTML = "Failed to load purchases.";
  }
}

// Delete product
async function deleteProduct(id) {
  try {
    await fetch(`${API_BASE}/admin/delete-product/${id}`, { method: "DELETE" });
    showToast("Product deleted.");
    loadProducts();
  } catch {
    showToast("Failed to delete.");
  }
}

loadProducts();
loadPurchases();
