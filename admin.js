productForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const title = document.getElementById("productTitle").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const imageFile = document.getElementById("productImage").files[0];

  if (!title) {
    alert("Title is required");
    return;
  }
  if (isNaN(price) || price <= 0) {
    alert("Please enter a valid positive price");
    return;
  }
  if (isNaN(stock) || stock < 0) {
    alert("Please enter a valid stock quantity");
    return;
  }
  if (!imageFile) {
    alert("Please select an image");
    return;
  }

  const reader = new FileReader();
  reader.onload = function() {
    const imageBase64 = reader.result.split(",")[1]; // strip prefix here

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
    .catch(err => {
      console.error("Network error:", err);
      alert("Network error");
    });
  };
  reader.readAsDataURL(imageFile);
});
