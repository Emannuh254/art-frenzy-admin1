const API_BASE = "https://art-frenzy-admin-3.onrender.com";
const MAX_FILE_SIZE_MB = 5;

// ---------------- Toast ----------------
function showToast(msg, success=true){
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = success ? "#222" : "#800000";
    toast.style.display = "block";
    setTimeout(()=> toast.style.display="none", 3000);
}

// ---------------- Logs ----------------
const logContainer = document.getElementById("logContainer");
function logMessage(msg){
    const p = document.createElement("p");
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContainer.appendChild(p);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// ---------------- Spinner ----------------
function setLoading(show){
    document.getElementById("spinner").style.display = show?"inline-block":"none";
}

// ---------------- Section Toggle ----------------
function showSection(id){
    document.querySelectorAll("section").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// ---------------- Image Preview ----------------
const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");

productImageInput.addEventListener("change",()=>{
    imagePreview.innerHTML="";
    const file = productImageInput.files[0];
    if(!file) return;

    if(!file.type.startsWith("image/")){
        showToast("Invalid file type", false);
        productImageInput.value="";
        return;
    }

    const sizeMB = file.size/(1024*1024);
    if(sizeMB>MAX_FILE_SIZE_MB){
        showToast(`Image too large. Max ${MAX_FILE_SIZE_MB} MB`, false);
        productImageInput.value="";
        return;
    }

    const reader = new FileReader();
    reader.onload=()=> {
        const img = document.createElement("img");
        img.src = reader.result;
        img.className="product-img";
        imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
});

// ---------------- Shorten File Name ----------------
function shortenFileName(file){
    const ext = file.name.split('.').pop();
    return { name: `prod_${Date.now()}.${ext}`, original:file };
}

// ---------------- Add Product ----------------
document.getElementById("productForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const title=document.getElementById("productTitle").value.trim();
    const price=document.getElementById("productPrice").value.trim();
    const stock=document.getElementById("productStock").value.trim();
    const file=productImageInput.files[0];
    if(!file) return showToast("Select an image", false);

    const {name: shortName} = shortenFileName(file);

    logContainer.innerHTML="";
    logMessage("Preparing product data...");
    setLoading(true);

    const reader=new FileReader();
    reader.onload=async ()=>{
        const base64=reader.result;
        const payload={title,price,stock,image:base64,filename:shortName};

        logMessage("Sending data to backend...");
        try{
            const res=await fetch(`${API_BASE}/admin/add-product`,{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify(payload)
            });
            const data=await res.json();

            if(res.ok){
                logMessage("✅ Product added successfully!");
                showToast("Product added successfully");
                e.target.reset();
                imagePreview.innerHTML="";
                loadProducts();
            } else{
                logMessage("❌ Error: "+(data.error||"Unknown error"));
                showToast(data.error||"Error adding product", false);
            }
        } catch(err){
            logMessage("❌ Network error: "+err.message);
            showToast("Network error", false);
        } finally{
            setLoading(false);
        }
    };
    reader.readAsDataURL(file);
});

// ---------------- Delete Product ----------------
async function deleteProduct(id){
    if(!confirm("Are you sure you want to delete this product?")) return;
    try{
        const res=await fetch(`${API_BASE}/admin/delete-product/${id}`, {method:"DELETE"});
        const data=await res.json();
        if(res.ok){
            showToast("Product deleted");
            logMessage(`Deleted product ID ${id}`);
            loadProducts();
        } else{
            showToast(data.error||"Error deleting product", false);
            logMessage("Delete error: "+(data.error||"Unknown"));
        }
    } catch(err){
        logMessage("Delete network error: "+err.message);
        showToast("Failed to delete product", false);
    }
}

// ---------------- Load Products ----------------
async function loadProducts(){
    try{
        const res=await fetch(`${API_BASE}/admin/products`);
        const data=await res.json();
        const tbody=document.getElementById("productTableBody");
        tbody.innerHTML="";
        data.forEach(p=>{
            const tr=document.createElement("tr");
            tr.innerHTML=`
                <td><img src="${p.images[0]||''}" class="product-img"/></td>
                <td>${p.title}</td>
                <td>${p.price}</td>
                <td>${p.stock}</td>
                <td>${new Date(p.created_at).toLocaleString()}</td>
                <td><button onclick="deleteProduct(${p.id})">Delete</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err){
        logMessage("Error loading products: "+err.message);
    }
}

// ---------------- Load Purchases ----------------
async function loadPurchases(){
    try{
        const res=await fetch(`${API_BASE}/admin/purchases`);
        const data=await res.json();
        const tbody=document.getElementById("purchaseTableBody");
        tbody.innerHTML="";
        data.forEach(p=>{
            const tr=document.createElement("tr");
            tr.innerHTML=`
                <td>${p.product_title}</td>
                <td>${p.buyer_name} (${p.buyer_phone})</td>
                <td>${p.product_price}</td>
                <td>${p.drop_location}</td>
                <td>${new Date(p.purchase_time).toLocaleString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err){
        logMessage("Error loading purchases: "+err.message);
    }
}

// ---------------- Load Logs ----------------
async function loadLogs(){
    try{
        const res=await fetch(`${API_BASE}/admin/logs`);
        const data=await res.json();
        const container=document.getElementById("logContainer");
        container.innerHTML="";
        data.logs.forEach(l=>{
            const p=document.createElement("p");
            p.textContent=l;
            container.appendChild(p);
        });
        container.scrollTop=container.scrollHeight;
    } catch(err){
        console.error(err);
    }
}

// ---------------- Initial Load ----------------
loadProducts();
loadPurchases();
setInterval(loadLogs, 5000);  // refresh logs every 5 sec
