/**
 * Login Page Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const submitBtn = document.getElementById('login-submit-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const lockoutBanner = document.getElementById('lockout-banner');
    const lockoutMsg = document.getElementById('lockout-message');

    // 1-Click Evaluator Demo Credentials
    const demoAdminBtn = document.getElementById('btn-demo-admin');
    const demoUserBtn = document.getElementById('btn-demo-user');

    if (demoAdminBtn) {
        demoAdminBtn.addEventListener('click', () => {
            emailInput.value = 'admin@demo.com';
            passwordInput.value = 'AdminPass123!';
            window.ui.showToast('Administrator evaluation credentials filled', 'info');
        });
    }

    if (demoUserBtn) {
        demoUserBtn.addEventListener('click', () => {
            emailInput.value = 'user@demo.com';
            passwordInput.value = 'UserPass123!';
            window.ui.showToast('Standard user evaluation credentials filled', 'info');
        });
    }

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            window.ui.showToast('Email address and password are required', 'error');
            return;
        }

        window.ui.setLoading(submitBtn, true, 'Authenticating...');
        if (lockoutBanner) lockoutBanner.classList.add('d-none');

        const result = await window.apiClient.post('/api/auth/login', { email, password });

        window.ui.setLoading(submitBtn, false, 'Sign In to Account');

        if (result.status === 423) { // Account Locked
            if (lockoutBanner && lockoutMsg) {
                lockoutBanner.classList.remove('d-none');
                lockoutMsg.textContent = result.data.message;
            }
            window.ui.showToast(result.data.message, 'warning');
            return;
        }

        if (!result.ok) {
            const attemptsLeft = result.data.attemptsRemaining;
            let errorMsg = result.data.message || 'Authentication failed';
            if (attemptsLeft !== undefined && attemptsLeft > 0) {
                errorMsg += ` (${attemptsLeft} attempt(s) remaining before temporary lockout)`;
            }
            window.ui.showToast(errorMsg, 'error');
            return;
        }

        // Authentication Success
        window.authService.setSession(result.data.token, result.data.user);
        window.ui.showToast(`Authentication successful. Welcome, ${result.data.user.name}.`, 'success');

        setTimeout(() => {
            if (result.data.user.role === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 800);
    });
});
