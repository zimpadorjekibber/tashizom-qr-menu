document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('error-msg');

    // Hardcoded credentials for demo
    if (username === 'admin' && password === 'admin123') {
        // Admin Login
        sessionStorage.setItem('userRole', 'admin');
        window.location.href = 'admin.html';
    } else if (username === 'staff' && password === 'staff123') {
        // Staff Login
        sessionStorage.setItem('userRole', 'staff');
        window.location.href = 'staff.html';
    } else {
        // Invalid
        errorMsg.style.display = 'block';
    }
});
