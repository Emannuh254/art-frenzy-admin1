const API_BASE = "https://art-frenzy-admin-3.onrender.com";
const productsContainer = document.getElementById("products");
const purchasesContainer = document.getElementById("purchases");
const form = document.getElementById("productForm");
const toast = document.getElementById("toast");

// Modal setup
const modal = document.createElement("div");
modal.id = "modal";
modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:none;justify-content:center;align-items:center;z-index:1000;";
const modalBody = document.createElement("div");
modalBody.style.cssText = "background:#222;color:#eee;padding:1rem;border-radius:10px;min-width:300px;max-width:90%;";
modal.appendChild(modalBody);
document.body.appendChild(modal);

// Toast helper
function showToast(msg) {
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 3000);
}

// Upload image immediately
let uploadedImageUrl = "", uploadedThumbUrl = "";
document.getElementById("image").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(`${API_BASE}/admin/upload-image`, { method: "POST", body: formData });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    uploadedImageUrl = data.image_url;
    uploadedThumbUrl = data.thumb_url;
    showToast("Image uploaded ✅");
  } catch(err) {
    console.error(err);
    showToast("Image upload failed ❌");
  }
});

// Add product
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const price = parseFloat(document.getElementById("price").value);
  const stock = parseInt(document.getElementById("stock").value);

  try {
    const res = await fetch(`${API_BASE}/admin/add-product`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ title, price, stock, image_url: uploadedImageUrl, thumb_url: uploadedThumbUrl })
    });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    showToast("Product added ✅");
    form.reset();
    uploadedImageUrl = uploadedThumbUrl = "";
    loadProducts();
  } catch(err) {
    console.error(err);
    showToast("Failed to add product ❌");
  }
});

// Load products
async function loadProducts() {
  productsContainer.innerHTML = "Loading...";
  showToast("Loading products...");
  try {
    const res = await fetch(`${API_BASE}/admin/products`);
    const products = await res.json();
    if(products.error) throw new Error(products.error);

    productsContainer.innerHTML = "";
    if (!products.length) {
      productsContainer.innerHTML = "<p style='text-align:center;'>No products available.</p>";
      showToast("No products found ⚠️");
      return;
    }

    products.forEach(p => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        ${p.stock===0?'<div class="sold-badge">Sold Out</div>':''}
        <img src="${p.thumb_url||p.image_url}" alt="${p.title}" />
        <div class="details" style="text-align:center;">
          <h3>${p.title}</h3>
          <p>KES ${p.price}</p>
          <p>Stock: ${p.stock}</p>
        </div>
        <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;margin-top:0.5rem;">
          <button onclick="openProductModal(${p.id}, \`${p.title}\`, ${p.price}, ${p.stock})">Manage</button>
          <button onclick="deleteProduct(${p.id})">Delete</button>
        </div>
      `;
      productsContainer.appendChild(card);
    });
    showToast(`Loaded ${products.length} products ✅`);
    updateGridCentering();
  } catch(err) {
    console.error("Error loading products:", err);
    productsContainer.innerHTML = "<p style='text-align:center;'>Failed to load products.</p>";
    showToast("Error loading products ❌");
  }
}

// Load purchases
async function loadPurchases() {
  purchasesContainer.innerHTML = "Loading...";
  showToast("Loading purchases...");
  try {
    const res = await fetch(`${API_BASE}/admin/purchases`);
    const purchases = await res.json();
    if(purchases.error) throw new Error(purchases.error);

    purchasesContainer.innerHTML = "";
    if(!purchases.length){
      purchasesContainer.innerHTML = "<p style='text-align:center;'>No purchases yet.</p>";
      showToast("No purchases found ⚠️");
      return;
    }

    purchases.forEach(p => {
      const div = document.createElement("div");
      div.className = "purchase-item";
      div.innerHTML = `
        <p><strong>${p.buyer_name}</strong> (${p.buyer_phone})</p>
        <p>Location: ${p.drop_location}</p>
        <p>Product: ${p.product_title} — KES ${p.product_price} — Txn: ${p.transaction_id}</p>
        <p>Time: ${new Date(p.purchase_time).toLocaleString()}</p>
      `;
      purchasesContainer.appendChild(div);
    });
    showToast(`Loaded ${purchases.length} purchases ✅`);
  } catch(err){
    console.error("Error loading purchases:", err);
    purchasesContainer.innerHTML = "<p style='text-align:center;'>Failed to load purchases.</p>";
    showToast("Error loading purchases ❌");
  }
}

// Modal
function openProductModal(id, title, price, stock) {
  modalBody.innerHTML = `
    <h3>${title}</h3>
    <p>Price: KES ${price}</p>
    <p>Stock: ${stock}</p>
    <label>Quantity to sell/order:</label>
    <input type="number" id="order-qty" value="1" min="1" max="${stock}" style="width:60px;padding:0.3rem;margin-bottom:0.5rem;">
    <div style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
      <button id="confirm-order">Place Order</button>
      <button id="update-stock">Update Stock</button>
      <button id="close-modal">Close</button>
    </div>
  `;
  modal.style.display = 'flex';

  document.getElementById("confirm-order").onclick = async () => {
    const qty = parseInt(document.getElementById("order-qty").value);
    if(qty < 1 || qty > stock){ alert("Invalid quantity"); return; }
    try{
      const res = await fetch(`${API_BASE}/admin/add-purchase`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          product_id: id,
          buyer_name: "Admin",
          buyer_phone: "-",
          drop_location: "N/A",
          transaction_id: "ADMIN-" + Date.now(),
          client_id: "admin-client",
          time: new Date().toISOString(),
          quantity: qty
        })
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      showToast(`Order placed (${qty} pcs) ✅`);
      modal.style.display='none';
      loadProducts();
      loadPurchases();
    } catch(err){ console.error(err); showToast("Failed to place order ❌"); }
  };

  document.getElementById("update-stock").onclick = async () => {
    const newStock = parseInt(prompt("Enter new stock value:", stock));
    if(isNaN(newStock) || newStock < 0){ alert("Invalid stock"); return; }
    try{
      const res = await fetch(`${API_BASE}/admin/update-stock`, { 
        method:"POST", 
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ id, stock: newStock }) 
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      showToast(`Stock updated ✅ New stock: ${data.stock}`);
      modal.style.display='none';
      loadProducts();
    }catch(err){
      console.error("Stock update error:", err);
      showToast("Failed to update stock ❌");
    }
  };

  document.getElementById("close-modal").onclick = () => { modal.style.display='none'; };
}

// Delete product
async function deleteProduct(id) {
  if(!confirm("Delete this product?")) return;
  try {
    const res = await fetch(`${API_BASE}/admin/delete-product/${id}`, { method:"DELETE" });
    const data = await res.json();
    if(data.error) throw new Error(data.error);
    showToast("Product deleted ✅");
    loadProducts();
  } catch(err){ console.error(err); showToast("Failed to delete ❌"); }
}

// Close modal on outside click
modal.onclick = (e) => { if(e.target===modal) modal.style.display='none'; }

// Init
loadProducts();
loadPurchases();

function updateGridCentering() {
  const products = productsContainer.children.length;
  const purchases = purchasesContainer.children.length;
  if (products + purchases === 0) document.body.classList.add('centered');
  else document.body.classList.remove('centered');
}
updateGridCentering();
