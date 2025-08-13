// admin.js

const API_BASE = "https://art-frenzy-admin-3.onrender.com";
const MAX_FILE_SIZE_MB = 5;

// Toast
function showToast(msg, success=true){
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = success ? "#222" : "#800000";
    toast.style.display = "block";
    toast.style.opacity = "1";
    setTimeout(()=>{ toast.style.opacity="0"; setTimeout(()=>toast.style.display="none",300); }, 3000);
}

// Section toggle
function showSection(id){
    document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// Image preview & validation
const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");

productImageInput.addEventListener("change", () => {
    imagePreview.innerHTML = "";
    const file = productImageInput.files[0];
    if(!file) return;

    // Validate type
    if(!file.type.startsWith("image/")){
        showToast("Invalid file type", false);
        productImageInput.value = "";
        return;
    }

    // Validate size
    const sizeMB = file.size / (1024 * 1024);
    if(sizeMB > MAX_FILE_SIZE_MB){
        showToast(`Image too large. Max ${MAX_FILE_SIZE_MB} MB`, false);
        productImageInput.value = "";
        return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = ()=> {
        const img = document.createElement("img");
        img.src = reader.result;
        imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
});

// Helper to shorten filename
function shortenFileName(file){
    const ext = file.name.split('.').pop();
    const shortName = "prod_" + Date.now();
    return { name: `${shortName}.${ext}`, original: file };
}

// Load products from backend
async function loadProducts() {
    const tbody = document.getElementById("productTableBody");
    tbody.innerHTML = "<tr><td colspan='6'>Loading...</td></tr>";

    try {
        const res = await fetch(`${API_BASE}/admin/products`);
        const products = await res.json();
        tbody.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.image}" alt="${p.title}"></td>
                <td>${p.title}</td>
                <td>${p.price}</td>
                <td>${p.stock}</td>
                <td>
                    ${new Date(p.created_at).toLocaleString()}
                </td>
                <td>
                    <button onclick="deleteProduct(${p.id})">Delete</button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        tbody.innerHTML = "<tr><td colspan='6'>Failed to load products</td></tr>";
        console.error(err);
    }
}

// Load purchases from backend
async function loadPurchases() {
    const tbody = document.getElementById("purchaseTableBody");
    tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    try {
        const res = await fetch(`${API_BASE}/admin/purchases`);
        const purchases = await res.json();
        tbody.innerHTML = purchases.map(p => `
            <tr>
                <td>${p.product}</td>
                <td>${p.buyer}</td>
                <td>${p.price}</td>
                <td>${p.location}</td>
                <td>${new Date(p.date).toLocaleString()}</td>
            </tr>
        `).join("");
    } catch (err) {
        tbody.innerHTML = "<tr><td colspan='5'>Failed to load purchases</td></tr>";
        console.error(err);
    }
}

// Add product
document.getElementById("productForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const title = document.getElementById("productTitle").value;
    const price = document.getElementById("productPrice").value;
    const stock = document.getElementById("productStock").value;
    const file = productImageInput.files[0];
    if(!file) return showToast("Select an image", false);

    const { name: shortName } = shortenFileName(file);

    const reader = new FileReader();
    reader.onload = async ()=>{
        const base64 = reader.result;
        const payload = { title, price, stock, image: base64, filename: shortName };
        try{
            const res = await fetch(`${API_BASE}/admin/add-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if(res.ok){
                showToast("Product added successfully");
                e.target.reset();
                imagePreview.innerHTML = "";
                loadProducts();
            } else showToast(data.error || "Error adding product", false);
        } catch(err){
            console.error(err);
            showToast("Network error", false);
        }
    };
    reader.readAsDataURL(file);
});

// Delete product
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/delete-product/${id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (res.ok) {
            showToast("Product deleted");
            loadProducts();
        } else showToast(data.error || "Error deleting product", false);
    } catch (err) {
        console.error(err);
        showToast("Failed to delete product", false);
    }
}

// Initial load
loadProducts();
loadPurchases();
