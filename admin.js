const API_BASE = "https://art-frenzy-admin.onrender.com";

const productsContainer = document.getElementById("products");
const purchasesContainer = document.getElementById("purchases");
const form = document.getElementById("productForm");
const toast = document.getElementById("toast");

let uploadedImageUrl = "";
let uploadedThumbUrl = "";

// Show toast notifications
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
    formData.append("image", file); // must match Flask key

    try {
        const res = await fetch(`${API_BASE}/admin/upload-image`, { method: "POST", body: formData });
        const data = await res.json();
        if(data.error){
            showToast("Upload failed: " + data.error);
            return;
        }
        uploadedImageUrl = data.image_url;
        uploadedThumbUrl = data.thumb_url;
        showToast("Image uploaded!");
    } catch(err) {
        console.error(err);
        showToast("Upload failed.");
    }
});

// Submit new product
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;

    try {
        const res = await fetch(`${API_BASE}/admin/add-product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title, price, stock,
                image_url: uploadedImageUrl,
                thumb_url: uploadedThumbUrl
            }),
        });

        const data = await res.json();
        if(res.ok){
            showToast("Product added!");
            form.reset();
            uploadedImageUrl = uploadedThumbUrl = "";
            loadProducts();
        } else {
            showToast("Error: " + (data.error || "Unknown"));
        }
    } catch(err) {
        console.error(err);
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
        if(!products || products.length === 0){
            productsContainer.innerHTML = "<p style='text-align:center;'>No products available.</p>";
            return;
        }

        products.forEach(p => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                ${p.stock === 0 ? '<div class="sold-badge">Sold Out</div>' : ''}
                <img src="${p.thumb_url || p.image_url}" alt="${p.title}" />
                <h3>${p.title}</h3>
                <p>KES ${p.price}</p>
                <p>Stock: ${p.stock}</p>
                <button onclick="deleteProduct(${p.id})">Delete</button>
            `;
            productsContainer.appendChild(card);
        });
    } catch(err){
        console.error(err);
        productsContainer.innerHTML = "<p style='text-align:center; color:red;'>Failed to load products.</p>";
    }
}

// Load purchases
async function loadPurchases() {
    purchasesContainer.innerHTML = "Loading...";
    try {
        const res = await fetch(`${API_BASE}/admin/purchases`);
        const purchases = await res.json();

        purchasesContainer.innerHTML = "";
        if(!purchases || purchases.length === 0){
            purchasesContainer.innerHTML = "<p style='text-align:center;'>No purchases yet.</p>";
            return;
        }

        purchases.forEach(p => {
            const div = document.createElement("div");
            div.className = "purchase-item";
            div.innerHTML = `
                <p><strong>${p.buyer_name}</strong> (${p.buyer_phone})</p>
                <p>Location: ${p.drop_location}</p>
                <p>Product: ${p.product_title || p.product_id} — Txn: ${p.transaction_id}</p>
                <p>Time: ${new Date(p.purchase_time).toLocaleString()}</p>
            `;
            purchasesContainer.appendChild(div);
        });
    } catch(err){
        console.error(err);
        purchasesContainer.innerHTML = "<p style='text-align:center; color:red;'>Failed to load purchases.</p>";
    }
}

// Delete product
async function deleteProduct(id){
    if(!confirm("Are you sure you want to delete this product?")) return;
    try{
        const res = await fetch(`${API_BASE}/admin/delete-product/${id}`, { method: "DELETE" });
        const data = await res.json();
        if(res.ok){
            showToast("Product deleted.");
            loadProducts();
        } else {
            showToast("Failed: " + (data.error || "Unknown"));
        }
    } catch(err){
        console.error(err);
        showToast("Failed to delete product.");
    }
}

// Initialize
loadProducts();
loadPurchases();
