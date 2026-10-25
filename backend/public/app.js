// =========================================================
// STATE & CONFIG
// =========================================================
// Use relative path so API calls work seamlessly both on localhost and production (Vercel)
const API_BASE = '';

let forgotState = {
    email: '',
    otp: '',
    timerInterval: null,
    timeLeft: 60
};

// =========================================================
// DOM ELEMENTS
// =========================================================
const authFormsView = document.getElementById('auth-forms-view');
const forgotView = document.getElementById('forgot-view');
const dashboardView = document.getElementById('dashboard-view');

const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const openForgotBtn = document.getElementById('open-forgot-btn');
const backToLoginBtn = document.getElementById('back-to-login-btn');

// Forgot Password Steps
const forgotStep1 = document.getElementById('forgot-step-1');
const forgotStep2 = document.getElementById('forgot-step-2');
const forgotStep3 = document.getElementById('forgot-step-3');

const stepDot1 = document.getElementById('step-dot-1');
const stepDot2 = document.getElementById('step-dot-2');
const stepDot3 = document.getElementById('step-dot-3');
const stepLine1 = document.getElementById('step-line-1');
const stepLine2 = document.getElementById('step-line-2');

const forgotEmailForm = document.getElementById('forgot-email-form');
const verifyOtpForm = document.getElementById('verify-otp-form');
const resetPasswordForm = document.getElementById('reset-password-form');

const forgotEmailInput = document.getElementById('forgot-email');
const displayOtpEmail = document.getElementById('display-otp-email');
const otpDigits = document.querySelectorAll('.otp-digit');
const devOtpBanner = document.getElementById('dev-otp-banner');
const devOtpCode = document.getElementById('dev-otp-code');

const timerText = document.getElementById('timer-text');
const timerCount = document.getElementById('timer-count');
const resendOtpBtn = document.getElementById('resend-otp-btn');

// Dashboard Elements
const dashUserName = document.getElementById('dash-user-name');
const dashUserEmail = document.getElementById('dash-user-email');
const dashUserAvatar = document.getElementById('user-avatar');
const dashCreatedAt = document.getElementById('dash-created-at');
const dashTokenPreview = document.getElementById('dash-token-preview');
const copyTokenBtn = document.getElementById('copy-token-btn');
const testProtectedBtn = document.getElementById('test-protected-btn');
const logoutBtn = document.getElementById('logout-btn');

// =========================================================
// TOAST NOTIFICATIONS
// =========================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle-2';
    if (type === 'error') iconName = 'alert-circle';

    toast.innerHTML = `
        <i data-lucide="${iconName}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// =========================================================
// TAB SWITCHING (LOGIN / REGISTER)
// =========================================================
tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
});

tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
});

// =========================================================
// PASSWORD VISIBILITY TOGGLE
// =========================================================
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = '<i data-lucide="eye-off"></i>';
        } else {
            input.type = 'password';
            btn.innerHTML = '<i data-lucide="eye"></i>';
        }
        if (window.lucide) lucide.createIcons();
    });
});

// =========================================================
// BUTTON LOADING STATE HELPER
// =========================================================
function setButtonLoading(button, isLoading, defaultText) {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalHtml = button.innerHTML;
        button.innerHTML = `<div class="spinner"></div> <span>Processing...</span>`;
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalHtml || defaultText;
        if (window.lucide) lucide.createIcons();
    }
}

// =========================================================
// 1. LOGIN HANDLER
// =========================================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Login successful! Welcome back.', 'success');
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            showDashboard(data.user, data.token);
        } else {
            showToast(data.message || 'Invalid email or password', 'error');
        }
    } catch (err) {
        showToast('Unable to connect to server. Please ensure backend is running.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// =========================================================
// 2. REGISTER HANDLER
// =========================================================
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const submitBtn = document.getElementById('register-submit-btn');

    if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Registration successful! Please sign in.', 'success');
            registerForm.reset();
            tabLoginBtn.click();
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').focus();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Unable to connect to server.', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// =========================================================
// 3. FORGOT PASSWORD FLOW
// =========================================================

// Switch to Forgot View
openForgotBtn.addEventListener('click', () => {
    authFormsView.classList.remove('active');
    forgotView.classList.add('active');
    goToForgotStep(1);
});

// Back to Login View
backToLoginBtn.addEventListener('click', () => {
    forgotView.classList.remove('active');
    dashboardView.classList.remove('active');
    authFormsView.classList.add('active');
    clearInterval(forgotState.timerInterval);
});

function goToForgotStep(stepNumber) {
    [forgotStep1, forgotStep2, forgotStep3].forEach(s => s.classList.remove('active'));
    [stepDot1, stepDot2, stepDot3].forEach(d => {
        d.classList.remove('active', 'completed');
    });
    stepLine1.classList.remove('active');
    stepLine2.classList.remove('active');

    if (stepNumber === 1) {
        forgotStep1.classList.add('active');
        stepDot1.classList.add('active');
    } else if (stepNumber === 2) {
        forgotStep2.classList.add('active');
        stepDot1.classList.add('completed');
        stepDot2.classList.add('active');
        stepLine1.classList.add('active');
        setTimeout(() => otpDigits[0].focus(), 100);
    } else if (stepNumber === 3) {
        forgotStep3.classList.add('active');
        stepDot1.classList.add('completed');
        stepDot2.classList.add('completed');
        stepDot3.classList.add('active');
        stepLine1.classList.add('active');
        stepLine2.classList.add('active');
        document.getElementById('new-password').focus();
    }
}

// Step 1: Send OTP
forgotEmailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotEmailInput.value.trim();
    const submitBtn = document.getElementById('send-otp-btn');

    if (!email) {
        showToast('Please enter your email', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            forgotState.email = email;
            displayOtpEmail.textContent = email;
            showToast('OTP sent successfully to your email!', 'success');

            if (data.devOtp) {
                devOtpCode.textContent = data.devOtp;
                devOtpBanner.classList.remove('hidden');
            }

            goToForgotStep(2);
            startOtpTimer();
        } else {
            showToast(data.message || 'Failed to send OTP', 'error');
        }
    } catch (err) {
        showToast('Network error while requesting OTP', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// OTP Inputs Navigation (Paste, Digits, Backspace)
otpDigits.forEach((digitInput, index) => {
    digitInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.length === 1 && index < otpDigits.length - 1) {
            otpDigits[index + 1].focus();
        }
    });

    digitInput.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpDigits[index - 1].focus();
        }
    });

    digitInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pasteData)) {
            pasteData.split('').forEach((char, i) => {
                if (otpDigits[i]) otpDigits[i].value = char;
            });
            otpDigits[5].focus();
        }
    });
});

function getOtpValue() {
    return Array.from(otpDigits).map(d => d.value).join('');
}

// Timer for OTP Resend
function startOtpTimer() {
    clearInterval(forgotState.timerInterval);
    forgotState.timeLeft = 60;
    resendOtpBtn.classList.add('hidden');
    timerText.classList.remove('hidden');
    timerCount.textContent = `${forgotState.timeLeft}s`;

    forgotState.timerInterval = setInterval(() => {
        forgotState.timeLeft -= 1;
        timerCount.textContent = `${forgotState.timeLeft}s`;

        if (forgotState.timeLeft <= 0) {
            clearInterval(forgotState.timerInterval);
            timerText.classList.add('hidden');
            resendOtpBtn.classList.remove('hidden');
        }
    }, 1000);
}

// Resend OTP
resendOtpBtn.addEventListener('click', async () => {
    if (!forgotState.email) return;
    try {
        const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotState.email })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast('New OTP sent!', 'success');
            if (data.devOtp) {
                devOtpCode.textContent = data.devOtp;
                devOtpBanner.classList.remove('hidden');
            }
            startOtpTimer();
        } else {
            showToast(data.message || 'Error resending OTP', 'error');
        }
    } catch (err) {
        showToast('Network error', 'error');
    }
});

// Step 2: Verify OTP
verifyOtpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = getOtpValue();
    const submitBtn = document.getElementById('verify-otp-btn');

    if (otp.length < 6) {
        showToast('Please enter complete 6-digit OTP', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotState.email, otp })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            forgotState.otp = otp;
            showToast('OTP verified successfully!', 'success');
            goToForgotStep(3);
        } else {
            showToast(data.message || 'Invalid or expired OTP', 'error');
        }
    } catch (err) {
        showToast('Network error while verifying OTP', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// Step 3: Reset Password
resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;
    const submitBtn = document.getElementById('reset-password-btn');

    if (!newPassword || !confirmNewPassword) {
        showToast('Please fill in both password fields', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showToast('Passwords do not match', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);

    try {
        const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: forgotState.email,
                otp: forgotState.otp,
                newPassword
            })
        });

        const data = await res.json();

        if (res.ok && data.success) {
            showToast('Password reset successfully! Please sign in with your new password.', 'success');
            resetPasswordForm.reset();
            forgotEmailForm.reset();
            otpDigits.forEach(d => d.value = '');
            clearInterval(forgotState.timerInterval);

            // Switch to login
            forgotView.classList.remove('active');
            authFormsView.classList.add('active');
            tabLoginBtn.click();
            document.getElementById('login-email').value = forgotState.email;
            document.getElementById('login-password').focus();
        } else {
            showToast(data.message || 'Failed to reset password', 'error');
        }
    } catch (err) {
        showToast('Network error while resetting password', 'error');
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

// =========================================================
// 4. USER DASHBOARD (PROTECTED VIEW)
// =========================================================
function showDashboard(user, token) {
    authFormsView.classList.remove('active');
    forgotView.classList.remove('active');
    dashboardView.classList.add('active');

    dashUserName.textContent = `Welcome, ${user.name || 'User'}!`;
    dashUserEmail.textContent = user.email;
    dashUserAvatar.textContent = (user.name ? user.name[0] : 'U').toUpperCase();
    dashCreatedAt.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    dashTokenPreview.textContent = token;
}

// Copy Token
copyTokenBtn.addEventListener('click', () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        navigator.clipboard.writeText(token);
        showToast('JWT Token copied to clipboard!', 'info');
    }
});

// Test Protected Route
testProtectedBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast('No token found', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await res.json();
        if (res.ok && data.success) {
            showToast(`Protected API verified! Logged in as: ${data.user.name} (${data.user.email})`, 'success');
        } else {
            showToast(data.message || 'Failed to verify protected route', 'error');
        }
    } catch (err) {
        showToast('Error testing protected route', 'error');
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    showToast('Logged out successfully', 'info');
    dashboardView.classList.remove('active');
    authFormsView.classList.add('active');
    tabLoginBtn.click();
});

// Check if already logged in on page load
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const res = await fetch(`${API_BASE}/api/auth/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showDashboard(data.user, token);
            } else {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
            }
        } catch (e) {
            // Ignore if offline
        }
    }
});
