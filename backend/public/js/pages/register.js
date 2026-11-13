/**
 * Registration Page Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const submitBtn = document.getElementById('register-submit-btn');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const roleSelect = document.getElementById('role');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // Password Strength Meter Elements
    const strengthFill = document.getElementById('strength-bar-fill');
    const strengthLabel = document.getElementById('strength-text-label');
    const ruleLength = document.getElementById('rule-length');
    const ruleUpper = document.getElementById('rule-uppercase');
    const ruleLower = document.getElementById('rule-lowercase');
    const ruleNumber = document.getElementById('rule-number');
    const ruleSymbol = document.getElementById('rule-symbol');

    if (passwordInput && strengthFill) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            const res = window.ui.evaluatePassword(val);

            strengthFill.style.width = `${res.score}%`;
            strengthFill.className = `strength-bar-fill ${res.colorClass}`;
            strengthLabel.textContent = val.length ? res.label : 'Awaiting entry';
            strengthLabel.className = `strength-label ${res.colorClass}`;

            updateRule(ruleLength, res.rules.length);
            updateRule(ruleUpper, res.rules.uppercase);
            updateRule(ruleLower, res.rules.lowercase);
            updateRule(ruleNumber, res.rules.number);
            updateRule(ruleSymbol, res.rules.symbol);
        });
    }

    function updateRule(element, isValid) {
        if (!element) return;
        const icon = element.querySelector('i');
        if (isValid) {
            element.classList.add('rule-valid');
            if (icon) icon.className = 'bi bi-check-circle-fill text-success';
        } else {
            element.classList.remove('rule-valid');
            if (icon) icon.className = 'bi bi-circle text-muted';
        }
    }

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const role = roleSelect ? roleSelect.value : 'user';
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!name || !email || !password || !confirmPassword) {
            window.ui.showToast('All fields are mandatory', 'error');
            return;
        }

        if (password !== confirmPassword) {
            window.ui.showToast('Password confirmation does not match', 'error');
            return;
        }

        if (password.length < 6) {
            window.ui.showToast('Password must contain at least 6 characters', 'error');
            return;
        }

        window.ui.setLoading(submitBtn, true, 'Creating Account...');

        const result = await window.apiClient.post('/api/auth/register', {
            name,
            email,
            password,
            role
        });

        window.ui.setLoading(submitBtn, false, 'Register Account');

        if (!result.ok) {
            window.ui.showToast(result.data.message || 'Registration failed', 'error');
            return;
        }

        window.ui.showToast(`Account registered with role: ${role.toUpperCase()}. Redirecting to Sign In...`, 'success');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1200);
    });
});
