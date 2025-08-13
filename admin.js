const API_BASE = "https://art-frenzy-admin-3.onrender.com";
const MAX_FILE_SIZE_MB = 5;

// Toast
function showToast(msg, success = true) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = success ? "#222" : "#800000";
    toast.style.display = "block";
    toast.style.opacity = "1";
    setTimeout(() => { 
        toast.style.opacity = "0"; 
        setTimeout(() => toast.style.display = "none", 300); 
    }, 3000);
}

// Logs container
const logContainer = document.getElementById("logContainer");
function logMessage(msg) {
    const p = document.createElement("p");
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logContainer.appendChild(p);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// Loading spinner
function setLoading(show) {
    const spinner = document.getElementById("spinner");
    spinner.style.display = show ? "inline-block" : "none";
}

// Section toggle
function showSection(id) {
    document.querySelectorAll("section").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

// Image preview & validation
const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");

productImageInput.addEventListener("change", () => {
    imagePreview.innerHTML = "";
    const file = productImageInput.files[0];
    if(!file) return;

    if(!file.type.startsWith("image/")){
        showToast("Invalid file type", false);
        productImageInput.value = "";
        return;
    }

    const sizeMB = file.size / (1024*1024);
    if(sizeMB > MAX_FILE_SIZE_MB){
        showToast(`Image too large. Max ${MAX_FILE_SIZE_MB} MB`, false);
        productImageInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        const img = document.createElement("img");
        img.src = reader.result;
        imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);
});

function shortenFileName(file){
    const ext = file.name.split('.').pop();
    const shortName = "prod_" + Date.now();
    return { name: `${shortName}.${ext}`, original: file };
}

// Add product with logs and animation
document.getElementById("productForm").addEventListener("submit", async e => {
    e.preventDefault();

    const title = document.getElementById("productTitle").value;
    const price = document.getElementById("productPrice").value;
    const stock = document.getElementById("productStock").value;
    const file = productImageInput.files[0];
    if(!file) return showToast("Select an image", false);

    const { name: shortName } = shortenFileName(file);

    logContainer.innerHTML = ""; // Clear logs
    logMessage("Preparing product data...");
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async () => {
        const base64 = reader.result;
        const payload = { title, price, stock, image: base64, filename: shortName };

        logMessage("Sending data to backend...");
        try {
            const res = await fetch(`${API_BASE}/admin/add-product`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if(res.ok){
                logMessage("Product added successfully!");
                showToast("Product added successfully");
                e.target.reset();
                imagePreview.innerHTML = "";
                loadProducts();
            } else {
                logMessage("Error: " + (data.error || "Unknown error"));
                showToast(data.error || "Error adding product", false);
            }
        } catch(err){
            logMessage("Network error: " + err.message);
            console.error(err);
            showToast("Network error", false);
        } finally {
            setLoading(false);
        }
    };
    reader.readAsDataURL(file);
});

// Delete product
async function deleteProduct(id) {
    if(!confirm("Are you sure you want to delete this product?")) return;
    try {
        const res = await fetch(`${API_BASE}/admin/delete-product/${id}`, { method: "DELETE" });
        const data = await res.json();
        if(res.ok){
            showToast("Product deleted");
            logMessage(`Deleted product ID ${id}`);
            loadProducts();
        } else {
            showToast(data.error || "Error deleting product", false);
            logMessage("Delete error: " + (data.error || "Unknown"));
        }
    } catch(err){
        console.error(err);
        showToast("Failed to delete product", false);
        logMessage("Delete network error: " + err.message);
    }
}

// Initial load
loadProducts();
loadPurchases();
