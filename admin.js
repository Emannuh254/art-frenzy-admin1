const reader = new FileReader();
reader.onload = async function() {
    try {
        const imageBase64 = reader.result.split(",")[1]; // short payload
        const ext = imageFile.name.split(".").pop();
        const shortName = `product_${Date.now()}.${ext}`;

        const res = await fetch(`${API_BASE}/admin/add-product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, price, stock, image: imageBase64, filename: shortName })
        });

        const data = await res.json();
        if (res.ok) {
            alert("Product added successfully!");
            productForm.reset();
            loadProducts();
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error(err);
        alert("Network or server error");
    }
};
reader.readAsDataURL(imageFile);
