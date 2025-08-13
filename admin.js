const API_BASE = "https://art-frenzy-admin-3.onrender.com";

const productsContainer = document.getElementById("products");
const purchasesContainer = document.getElementById("purchases");
const addProductForm = document.getElementById("addProductForm");

// Fetch and display products
async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE}/products`);
        const products = await res.json();
        productsContainer.innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.image_url}" alt="${p.title}" />
                <h3>${p.title}</h3>
                <p>Price: $${p.price}</p>
                <p>Stock: ${p.stock}</p>
                ${p.is_offer ? `<p>Offer Price: $${p.offer_price}</p>` : ""}
            </div>
        `).join("");
    } catch (err) {
        console.error("Failed to fetch products:", err);
    }
}

// Fetch and display purchases
async function fetchPurchases() {
    try {
        const res = await fetch(`${API_BASE}/purchases`);
        const purchases = await res.json();
        purchasesContainer.innerHTML = purchases.map(p => `
            <div class="purchase-card">
                <p>Buyer: ${p.buyer_name}</p>
                <p>Phone: ${p.buyer_phone}</p>
                <p>Location: ${p.drop_location}</p>
                <p>Product: ${p.product_title}</p>
                <p>Price: $${p.product_price}</p>
                <p>Transaction ID: ${p.transaction_id || "N/A"}</p>
                <p>Purchase Time: ${new Date(p.purchase_time).toLocaleString()}</p>
            </div>
        `).join("");
    } catch (err) {
        console.error("Failed to fetch purchases:", err);
    }
}

// Handle add product form submit
addProductForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(addProductForm);
    const file = formData.get("image");
    if (!file) return alert("Please select an image.");

    const reader = new FileReader();
    reader.onload = async () => {
        const base64 = reader.result; // includes data:image/...;base64, prefix

        const payload = {
            title: formData.get("title"),
            price: formData.get("price"),
            stock: formData.get("stock"),
            image: base64,
            is_offer: formData.get("is_offer") === "on",
            offer_price: formData.get("offer_price") || null,
            filename: file.name
        };

        try {
            const res = await fetch(`${API_BASE}/add-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (res.ok) {
                alert("Product added successfully!");
                fetchProducts();
                addProductForm.reset();
            } else {
                alert("Error: " + result.error);
            }
        } catch (err) {
            console.error("Failed to add product:", err);
        }
    };
    reader.readAsDataURL(file);
});

// Initial load
fetchProducts();
fetchPurchases();
