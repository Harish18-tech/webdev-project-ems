/**
 * auth.js
 * Handles login and registration forms
 */

function toggleAuthMode(mode) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const alertBox = document.getElementById('alert-box');
    
    // reset alerts
    alertBox.classList.add('hidden');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    }
}

function showAlert(message, isError = true) {
    const alertBox = document.getElementById('alert-box');
    alertBox.textContent = message;
    alertBox.classList.remove('hidden', 'alert-error', 'alert-success');
    alertBox.classList.add(isError ? 'alert-error' : 'alert-success');
}

// Handle login
document.getElementById('login-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const user = window.DB.getUserByEmail(email);
    if (!user) {
        showAlert('Account not found. Please register.');
        return;
    }

    if (user.password !== password) {
        showAlert('Invalid credentials. Please try again.');
        return;
    }

    // Success
    window.DB.setCurrentUser(user);
    if (user.role === 'teacher') {
        window.location.href = 'teacher-dashboard.html';
    } else {
        window.location.href = 'student-dashboard.html';
    }
});

// Handle registration
document.getElementById('register-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const role = document.getElementById('reg-role').value;
    const password = document.getElementById('reg-password').value;

    // Validation
    if (window.DB.getUserByEmail(email)) {
        showAlert('An account with this email already exists.');
        return;
    }

    if (password.length < 6) {
        showAlert('Password must be at least 6 characters.');
        return;
    }

    const newUser = {
        name: name,
        email: email,
        role: role,
        password: password
    };

    window.DB.saveUser(newUser);
    showAlert('Account created successfully! Switching to login...', false);
    
    // Auto login
    setTimeout(() => {
        window.DB.setCurrentUser(newUser);
        window.location.href = role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
    }, 1500);
});
