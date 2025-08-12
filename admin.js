document.addEventListener("DOMContentLoaded", () => {
    const productForm = document.getElementById("productForm");
    const productTableBody = document.getElementById("productTableBody");

    let products = [];

    productForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const title = document.getElementById("productTitle").value;
        const price = document.getElementById("productPrice").value;
        const stock = document.getElementById("productStock").value;
        const imageFile = document.getElementById("productImage").files[0];

        const reader = new FileReader();
        reader.onload = function () {
            const newProduct = {
                id: Date.now(),
                title,
                price,
                stock,
                image: reader.result
            };
            products.push(newProduct);
            renderProducts();
            productForm.reset();
        };
        reader.readAsDataURL(imageFile);
    });

    function renderProducts() {
        productTableBody.innerHTML = "";
        products.forEach(product => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><img src="${product.image}" width="50"></td>
                <td>${product.title}</td>
                <td>KES ${product.price}</td>
                <td>${product.stock}</td>
                <td>
                    <button onclick="editProduct(${product.id})">Edit</button>
                    <button onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            `;
            productTableBody.appendChild(row);
        });
    }

    window.deleteProduct = (id) => {
        products = products.filter(p => p.id !== id);
        renderProducts();
    };

    window.editProduct = (id) => {
        const product = products.find(p => p.id === id);
        if (product) {
            document.getElementById("productTitle").value = product.title;
            document.getElementById("productPrice").value = product.price;
            document.getElementById("productStock").value = product.stock;
            deleteProduct(id);
        }
    };
});

// Section Switching
function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(sectionId).classList.add("active");
}
function viewClientSite() {
    // Replace 'client.html' with the actual URL of your client's site
    window.location.href = "client.html";
}
