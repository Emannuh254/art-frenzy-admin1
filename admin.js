const API_BASE = "https://art-frenzy-admin-3.onrender.com";

// Sections toggle
function showSection(id) {
    document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// Load products from backend
async function loadProducts() {
    const tbody = document.getElementById("productTableBody");
    tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    try {
        const res = await fetch(`${API_BASE}/products`);
        const products = await res.json();
        tbody.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.image_url}" alt="${p.title}"></td>
                <td>${p.title}</td>
                <td>${p.price}</td>
                <td>${p.stock}</td>
                <td>
                    ${new Date(p.created_at).toLocaleString()}
                    <button onclick="deleteProduct(${p.id})" style="margin-left:5px;">Delete</button>
                </td>
            </tr>
        `).join("");
    } catch (err) {
        tbody.innerHTML = "<tr><td colspan='5'>Failed to load products</td></tr>";
        console.error(err);
    }
}

// Load purchases from backend
async function loadPurchases() {
    const tbody = document.getElementById("purchaseTableBody");
    tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

    try {
        const res = await fetch(`${API_BASE}/purchases`);
        const purchases = await res.json();
        tbody.innerHTML = purchases.map(p => `
            <tr>
                <td>${p.product_title}</td>
                <td>Buyer: ${p.buyer_name}<br>Phone: ${p.buyer_phone}</td>
                <td>${p.product_price}</td>
                <td>${p.drop_location}</td>
                <td>${new Date(p.purchase_time).toLocaleString()}</td>
            </tr>
        `).join("");
    } catch (err) {
        tbody.innerHTML = "<tr><td colspan='5'>Failed to load purchases</td></tr>";
        console.error(err);
    }
}

// Handle add product form
document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("productTitle").value;
    const price = document.getElementById("productPrice").value;
    const stock = document.getElementById("productStock").value;
    const file = document.getElementById("productImage").files[0];

    if (!file) return alert("Please select an image");

    const reader = new FileReader();
    reader.onload = async () => {
        const base64 = reader.result; // includes data:image/...;base64

        const payload = {
            title,
            price,
            stock,
            image: base64,
            filename: file.name
        };

        try {
            const res = await fetch(`${API_BASE}/add-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                alert("Product added successfully!");
                document.getElementById("productForm").reset();
                loadProducts();
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Network error");
        }
    };
    reader.readAsDataURL(file);
});

// Delete product
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
        const res = await fetch(`${API_BASE}/delete-product/${id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (res.ok) {
            alert("Product deleted");
            loadProducts();
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to delete product");
    }
}

// Initial load
loadProducts();
loadPurchases();
