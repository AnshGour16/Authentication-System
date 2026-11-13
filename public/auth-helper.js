/**
 * Shared Client-Side Authentication & UI Helpers
 */

// Toast Notifications
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'error') iconName = 'alert-circle';

    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', iconName);

    const span = document.createElement('span');
    span.textContent = message; // Safe from DOM XSS

    toast.appendChild(icon);
    toast.appendChild(span);
    container.appendChild(toast);

    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4500);
}

// Button Loading State Toggle
function setBtnLoading(button, isLoading, text = '') {
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        button.setAttribute('data-original-html', button.innerHTML);
        button.innerHTML = `<div class="spinner"></div><span>${text || 'Processing...'}</span>`;
    } else {
        button.disabled = false;
        const originalHtml = button.getAttribute('data-original-html');
        if (originalHtml) {
            button.innerHTML = originalHtml;
        } else if (text) {
            button.innerHTML = `<span>${text}</span>`;
        }
        if (window.lucide) lucide.createIcons();
    }
}

// Session Storage Helpers
function saveAuthSession(token, user) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
}

function getAuthToken() {
    return localStorage.getItem('auth_token');
}

function getAuthUser() {
    try {
        const u = localStorage.getItem('auth_user');
        return u ? JSON.parse(u) : null;
    } catch (e) {
        return null;
    }
}

function clearAuthSession() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

// Guard Route: Redirect to login if unauthenticated, or enforce role
function requireAuth(allowedRoles = null) {
    const token = getAuthToken();
    const user = getAuthUser();

    if (!token || !user) {
        window.location.href = 'login.html';
        return null;
    }

    if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
        showToast('Access denied: insufficient permissions', 'error');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1200);
        return null;
    }

    return { token, user };
}

// Password Visibility Toggle Listener
document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('.toggle-password');
    if (toggleBtn) {
        const targetId = toggleBtn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (input) {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
                if (window.lucide) lucide.createIcons();
            }
        }
    }
});

// Real-Time Password Strength Evaluator
function evaluatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };

    if (checks.length) score += 20;
    if (checks.lowercase) score += 20;
    if (checks.uppercase) score += 20;
    if (checks.number) score += 20;
    if (checks.special) score += 20;

    let label = 'Very Weak';
    let color = '#ef4444'; // Red

    if (score >= 80) {
        label = 'Strong';
        color = '#10b981'; // Green
    } else if (score >= 60) {
        label = 'Good';
        color = '#38bdf8'; // Blue
    } else if (score >= 40) {
        label = 'Fair';
        color = '#f59e0b'; // Amber
    }

    return { score, label, color, checks };
}

