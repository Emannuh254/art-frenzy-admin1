const API_BASE = "https://art-frenzy-admin-3.onrender.com";

const productsContainer = document.getElementById("products");
const purchasesContainer = document.getElementById("purchases");
const form = document.getElementById("productForm");
const toast = document.getElementById("toast");

let uploadedImageUrl = "";
let uploadedThumbUrl = "";

// Toast helper
function showToast(msg) {
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(()=>{toast.style.display="none"}, 3000);
}

// Upload image immediately
document.getElementById("image").addEventListener("change", async (e)=>{
  const file = e.target.files[0];
  if(!file) return;

  const formData = new FormData();
  formData.append("image", file);

  try{
    const res = await fetch(`${API_BASE}/admin/upload-image`, {method:"POST", body:formData});
    const data = await res.json();
    if(data.image_url){
      uploadedImageUrl = data.image_url;
      uploadedThumbUrl = data.thumb_url;
      showToast("Image uploaded!");
    } else showToast("Upload failed");
  }catch{
    showToast("Upload failed");
  }
});

// Submit product
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const title = document.getElementById("title").value;
  const price = document.getElementById("price").value;
  const stock = document.getElementById("stock").value;

  if(!uploadedImageUrl){
    showToast("Upload an image first");
    return;
  }

  try{
    const res = await fetch(`${API_BASE}/admin/add-product`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({title, price, stock, image_url:uploadedImageUrl, thumb_url:uploadedThumbUrl})
    });
    if(res.ok){
      showToast("Product added!");
      form.reset();
      uploadedImageUrl = uploadedThumbUrl = "";
      loadProducts();
    } else showToast("Failed to add product");
  }catch{
    showToast("Failed to add product");
  }
});

// Load products
async function loadProducts(){
  productsContainer.innerHTML = "Loading...";
  try{
    const res = await fetch(`${API_BASE}/admin/products`);
    const products = await res.json();
    productsContainer.innerHTML = "";
    if(!products || products.length===0){
      productsContainer.innerHTML="<p>No products available</p>";
      return;
    }
    products.forEach(p=>{
      const card = document.createElement("div");
      card.className="product-card";
      card.innerHTML=`
        ${p.stock==0?'<div class="sold-badge">Sold Out</div>':''}
        <img src="${p.thumb_url||p.image_url}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p>KES ${p.price}</p>
        <p>Stock: ${p.stock}</p>
        <button onclick="deleteProduct(${p.id})">Delete</button>
      `;
      productsContainer.appendChild(card);
    });
  }catch{
    productsContainer.innerHTML="Failed to load products";
  }
}

// Load purchases
async function loadPurchases(){
  purchasesContainer.innerHTML="Loading...";
  try{
    const res = await fetch(`${API_BASE}/admin/purchases`);
    const purchases = await res.json();
    purchasesContainer.innerHTML="";
    purchases.forEach(p=>{
      const div = document.createElement("div");
      div.className="purchase-item";
      div.innerHTML=`
        <p><strong>${p.buyer_name}</strong> (${p.buyer_phone})</p>
        <p>Location: ${p.drop_location}</p>
        <p>Product ID: ${p.product_id} — Txn: ${p.transaction_id}</p>
      `;
      purchasesContainer.appendChild(div);
    });
  }catch{
    purchasesContainer.innerHTML="Failed to load purchases";
  }
}

// Delete product
async function deleteProduct(id){
  try{
    const res = await fetch(`${API_BASE}/admin/delete-product/${id}`, {method:"DELETE"});
    if(res.ok) showToast("Product deleted");
    loadProducts();
  }catch{
    showToast("Failed to delete");
  }
}

loadProducts();
loadPurchases();
