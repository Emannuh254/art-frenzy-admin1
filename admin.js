const API_BASE = "https://art-frenzy-admin.onrender.com";

const productForm = document.getElementById("productForm");
const productTableBody = document.getElementById("productTableBody");
const purchaseTableBody = document.getElementById("purchaseTableBody");

let selectedProductId = null;

// Load products for admin table and client product list
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/admin/products`);
    const products = await res.json();
    if (products.error) throw new Error(products.error);

    // Admin product table
    productTableBody.innerHTML = "";
    products.forEach(({ id, title, price, stock, image_url }) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><img src="${image_url}" alt="${title}" style="width:60px;"/></td>
        <td>${title}</td>
        <td>KES ${price}</td>
        <td>${stock}</td>
        <td>
          <button class="edit-btn" data-id="${id}">Edit</button>
          <button class="delete-btn" data-id="${id}">Delete</button>
        </td>
      `;
      productTableBody.appendChild(tr);
    });

    // Attach edit/delete listeners
    document.querySelectorAll(".edit-btn").forEach(btn =>
      btn.addEventListener("click", () => editProductPrompt(btn.dataset.id))
    );
    document.querySelectorAll(".delete-btn").forEach(btn =>
      btn.addEventListener("click", () => deleteProduct(btn.dataset.id))
    );

  } catch (err) {
    alert("Error loading products: " + err.message);
  }
}

// Load purchases table (admin)
async function loadPurchases() {
  try {
    const res = await fetch(`${API_BASE}/purchases`);
    const purchases = await res.json();
    if (purchases.error) throw new Error(purchases.error);

    purchaseTableBody.innerHTML = "";
    purchases.forEach(({ product_title, product_price, drop_location, purchase_time }) => {
      const tr = document.createElement("tr");
      const dateStr = purchase_time ? new Date(purchase_time).toLocaleDateString() : "-";
      tr.innerHTML = `
        <td>${product_title}</td>
        <td>KES ${product_price}</td>
        <td>${drop_location}</td>
        <td>${dateStr}</td>
      `;
      purchaseTableBody.appendChild(tr);
    });
  } catch (err) {
    alert("Error loading purchases: " + err.message);
  }
}

// Edit product prompt
function editProductPrompt(productId) {
  const newTitle = prompt("Enter new title:");
  if (newTitle === null) return;
  const newPrice = prompt("Enter new price (KES):");
  if (newPrice === null) return;
  const newStock = prompt("Enter new stock quantity:");
  if (newStock === null) return;

  updateProduct(productId, {
    title: newTitle,
    price: parseFloat(newPrice),
    stock: parseInt(newStock, 10),
  });
}

// Update product
async function updateProduct(id, data) {
  try {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    alert(result.message);
    loadProducts();
  } catch (err) {
    alert("Error updating product: " + err.message);
  }
}

// Delete product
async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  try {
    const res = await fetch(`${API_BASE}/admin/products/${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    alert(result.message);
    loadProducts();
  } catch (err) {
    alert("Error deleting product: " + err.message);
  }
}

// Add product form submission
productForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const title = document.getElementById("productTitle").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const imageFile = document.getElementById("productImage").files[0];

  if (!imageFile) {
    alert("Please select an image");
    return;
  }

  const reader = new FileReader();
  reader.onload = function() {
    const imageBase64 = reader.result;

    fetch(`${API_BASE}/admin/add-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, price, stock, image: imageBase64 }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert("Error: " + data.error);
      } else {
        alert("Product added successfully!");
        productForm.reset();
        loadProducts();
      }
    })
    .catch(() => alert("Network error"));
  };
  reader.readAsDataURL(imageFile);
});