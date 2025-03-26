function switchTab(tab) {
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signupForm').classList.toggle('hidden', tab !== 'signup');
    document.getElementById('loginTab').classList.toggle('active', tab === 'login');
    document.getElementById('signupTab').classList.toggle('active', tab === 'signup');
}

async function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (data.token) {
            localStorage.setItem('authToken', data.token);
            window.location.href = '/'; // Redirect to main page
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Social login functions
function loginWithGoogle() {
    window.location.href = '/api/auth/google';
}

function loginWithFacebook() {
    window.location.href = '/api/auth/facebook';
}

// Signup functions
async function signupWithEmail() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const mobile = document.getElementById('signupMobile').value;

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, mobile })
        });

        const data = await response.json();
        if (data.success) {
            switchTab('login');
            alert('Account created successfully! Please login.');
        }
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
}

// Check URL parameters on page load
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'signup') {
        switchTab('signup');
    }
}
