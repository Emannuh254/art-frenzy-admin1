document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let username = document.getElementById("username").value.trim();
    let password = document.getElementById("password").value.trim();
    let errorMsg = document.getElementById("error-msg");

    // Placeholder validation
    if (username === "admin" && password === "1234") {
        window.location.href = "admin.html"; // Redirect after successful login
    } else {
        errorMsg.textContent = "Invalid username or password";
    }
});
