// ===== Config =====
const API_BASE = "https://art-frenzy-admin-3.onrender.com"; // change if needed
const MAX_FILE_SIZE_MB = 5;

const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");
const productForm = document.getElementById("productForm");
const productTableBody = document.getElementById("productTableBody");
const purchaseTableBody = document.getElementById("purchaseTableBody");
const spinner = document.getElementById("spinner");
let uploadedImageUrl = null;
let uploadedThumbUrl = null;

// ===== Toast =====
function showToast(msg, success = true, duration = 3000) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.background = success ? "#222" : "#800000";
  toast.style.display = "block";
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => (toast.style.display = "none"), 300);
  }, duration);
}

// ===== Section Switch =====
function showSection(id) {
  document.querySelectorAll("main section").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// ===== Helpers =====
function setLoading(isLoading) {
  spinner.style.display = isLoading ? "block" : "none";
}

function fmtMoney(v) {
  const n = Number(v || 0);
  return `KES ${n.toLocaleString()}`;
}

// ===== Image Upload (first) =====
productImageInput.addEventListener("change", async () => {
  imagePreview.innerHTML = "";
  uploadedImageUrl = null;
  uploadedThumbUrl = null;

  const file = productImageInput.files[0];
  if (!file) return showToast("No file selected", false);
  if (!file.type.startsWith("image/")) return showToast("Invalid file type", false);

  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > MAX_FILE_SIZE_MB)
    return showToast(`File too large (> ${MAX_FILE_SIZE_MB}MB)`, false);

  // Preview (styled to fit container)
  const wrap = document.createElement("div");
  wrap.style.width = "180px";
  wrap.style.height = "180px";
  wrap.style.background = "#111";
  wrap.style.border = "1px solid #333";
  wrap.style.borderRadius = "8px";
  wrap.style.display = "grid";
  wrap.style.placeItems = "center";
  wrap.style.overflow = "hidden";
  wrap.style.marginTop = "8px";

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.style.maxWidth = "100%";
  img.style.maxHeight = "100%";
  img.style.objectFit = "cover";
  img.alt = "preview";

  wrap.appendChild(img);
  imagePreview.appendChild(wrap);

  // Upload image separately
  const formData = new FormData();
  formData.append("image", file);

  try {
    setLoading(true);
    const res = await fetch(`${API_BASE}/admin/upload-image`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");

    uploadedImageUrl = data.image_url;
    uploadedThumbUrl = data.thumb_url || data.image_url;
    showToast("✅ Image uploaded!");
  } catch (err) {
    uploadedImageUrl = null;
    uploadedThumbUrl = null;
    showToast("❌ " + err.message, false);
  } finally {
    setLoading(false);
  }
});

// ===== Save product (later) =====
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!uploadedImageUrl) return showToast("Please upload an image first", false);

  const payload = {
    title: document.getElementById("productTitle").value.trim() || "Untitled",
    price: parseFloat(document.getElementById("productPrice").value) || 0,
    stock: parseInt(document.getElementById("productStock").value) || 0,
    image_url: uploadedImageUrl,
    thumb_url: uploadedThumbUrl
  };

  try {
    setLoading(true);
    const res = await fetch(`${API_BASE}/admin/add-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");

    showToast("✅ Product saved!");
    productForm.reset();
    imagePreview.innerHTML = "";
    uploadedImageUrl = null;
    uploadedThumbUrl = null;
    await loadProducts();
  } catch (err) {
    showToast("❌ " + err.message, false);
  } finally {
    setLoading(false);
  }
});

// ===== Load products =====
async function loadProducts() {
  try {
    setLoading(true);
    const res = await fetch(`${API_BASE}/admin/products`);
    const products = await res.json();

    productTableBody.innerHTML = products.map(p => `
      <tr>
        <td data-label="Image">${p.thumb_url ? `<img src="${p.thumb_url}" alt="${p.title}"/>` : (p.image_url ? `<img src="${p.image_url}" alt="${p.title}"/>` : "")}</td>
        <td data-label="Title">${p.title}</td>
        <td data-label="Price">${fmtMoney(p.price)}</td>
        <td data-label="Stock">${p.stock}</td>
        <td data-label="Time">${new Date(p.created_at).toLocaleString()}</td>
        <td data-label="Action">
          <button data-id="${p.id}" class="btn-delete">Delete</button>
        </td>
      </tr>
    `).join("");

    // hook delete buttons
    productTableBody.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!confirm("Delete this product?")) return;
        try {
          const res = await fetch(`${API_BASE}/admin/delete-product/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Delete failed");
          showToast("🗑️ Deleted");
          await loadProducts();
        } catch (err) {
          showToast("❌ " + err.message, false);
        }
      });
    });

  } catch (err) {
    showToast("❌ " + err.message, false);
  } finally {
    setLoading(false);
  }
}

// ===== Load purchases =====
async function loadPurchases() {
  try {
    setLoading(true);
    const res = await fetch(`${API_BASE}/admin/purchases`);
    const purchases = await res.json();

    purchaseTableBody.innerHTML = purchases.map(row => `
      <tr>
        <td data-label="Product">
          <div style="display:flex;align-items:center;gap:8px;">
            ${row.product_image ? `<img src="${row.product_image}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #333;">` : ""}
            <span>${row.product_title}</span>
          </div>
        </td>
        <td data-label="Buyer">${row.buyer_name} (${row.buyer_phone})</td>
        <td data-label="Price">${fmtMoney(row.product_price)}</td>
        <td data-label="Location">${row.drop_location}</td>
        <td data-label="Date">${new Date(row.purchase_time).toLocaleString()}</td>
      </tr>
    `).join("");

  } catch (err) {
    showToast("❌ " + err.message, false);
  } finally {
    setLoading(false);
  }
}

// ===== Boot =====
(async () => {
  await loadProducts();
  await loadPurchases();
})();
