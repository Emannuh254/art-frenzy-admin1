const API_BASE = "https://art-frenzy-admin-3.onrender.com";
const MAX_FILE_SIZE_MB = 5;

const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");

// ---------------- Toast ----------------
function showToast(msg, success = true, duration = 3000) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.style.background = success ? "#222" : "#800000";
    toast.style.opacity = "1";
    toast.style.display = "block";
    toast.style.transform = "translateY(0)";
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => (toast.style.display = "none"), 300);
    }, duration);
}

// ---------------- Image Preview & Upload ----------------
productImageInput.addEventListener("change", async () => {
    imagePreview.innerHTML = "";
    const file = productImageInput.files[0];
    if (!file) return showToast("No file selected", false);
    if (!file.type.startsWith("image/")) return showToast("Invalid file type", false);
    if (file.size / (1024 * 1024) > MAX_FILE_SIZE_MB)
        return showToast(`File too large (> ${MAX_FILE_SIZE_MB}MB)`, false);

    const previewImg = document.createElement("img");
    previewImg.src = URL.createObjectURL(file);
    imagePreview.appendChild(previewImg);

    // Upload immediately
    const formData = new FormData();
    formData.append("title", document.getElementById("productTitle").value || "Untitled");
    formData.append("price", document.getElementById("productPrice").value || 0);
    formData.append("stock", document.getElementById("productStock").value || 0);
    formData.append("image", file);

    try {
        const res = await fetch(`${API_BASE}admin/add-product`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            showToast("✅ Product uploaded!");
            loadProducts();
        } else {
            showToast(`❌ Upload failed: ${data.error}`, false);
        }
    } catch (err) {
        showToast("❌ Network error: " + err.message, false);
    }
});
