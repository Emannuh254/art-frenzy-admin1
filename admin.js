productForm.addEventListener("submit", function(e) {
  e.preventDefault();

  const title = document.getElementById("productTitle").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const imageFile = document.getElementById("productImage").files[0];

  if (!title) return alert("Title is required");
  if (isNaN(price) || price <= 0) return alert("Enter valid positive price");
  if (isNaN(stock) || stock < 0) return alert("Enter valid stock");
  if (!imageFile) return alert("Please select an image");

  const reader = new FileReader();
  reader.onload = function() {
    const imageBase64 = reader.result; // full Data URI

    // generate short random filename
    const ext = imageFile.name.split(".").pop();
    const shortName = `product_${Date.now()}.${ext}`;

    fetch(`${API_BASE}/admin/add-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        price,
        stock,
        image: imageBase64,
        filename: shortName
      }),
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
