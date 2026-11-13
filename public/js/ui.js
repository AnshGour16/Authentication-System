/**
 * UI & Presentation Helpers Module
 * Strictly adheres to Zero-Emoji Policy and uses Bootstrap Icons exclusively.
 */
const ui = {
    showToast(message, type = 'info', duration = 4000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            container.setAttribute('role', 'region');
            container.setAttribute('aria-live', 'polite');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'status');

        let iconClass = 'bi-info-circle-fill';
        if (type === 'success') iconClass = 'bi-check-circle-fill';
        if (type === 'error') iconClass = 'bi-exclamation-octagon-fill';
        if (type === 'warning') iconClass = 'bi-exclamation-triangle-fill';

        const icon = document.createElement('i');
        icon.className = `bi ${iconClass}`;

        const textSpan = document.createElement('span');
        textSpan.className = 'toast-message';
        textSpan.textContent = message; // Safe from DOM XSS

        toast.appendChild(icon);
        toast.appendChild(textSpan);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastExit 0.3s forwards ease';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, duration);
    },

    setLoading(button, isLoading, text = '') {
        if (!button) return;
        if (isLoading) {
            button.disabled = true;
            button.setAttribute('data-original-html', button.innerHTML);
            button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> <span>${text || 'Processing...'}</span>`;
        } else {
            button.disabled = false;
            const originalHtml = button.getAttribute('data-original-html');
            if (originalHtml) {
                button.innerHTML = originalHtml;
            } else if (text) {
                button.innerHTML = text;
            }
        }
    },

    initPasswordToggles() {
        document.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.toggle-password-btn');
            if (toggleBtn) {
                const targetId = toggleBtn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                if (input) {
                    const isPassword = input.type === 'password';
                    input.type = isPassword ? 'text' : 'password';
                    const icon = toggleBtn.querySelector('i');
                    if (icon) {
                        icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
                    }
                    toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
                }
            }
        });
    },

    evaluatePassword(password) {
        const rules = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /[0-9]/.test(password),
            symbol: /[^A-Za-z0-9]/.test(password)
        };

        let score = 0;
        if (rules.length) score += 20;
        if (rules.lowercase) score += 20;
        if (rules.uppercase) score += 20;
        if (rules.number) score += 20;
        if (rules.symbol) score += 20;

        let label = 'Very Weak';
        let colorClass = 'strength-danger';

        if (score >= 80) {
            label = 'Strong';
            colorClass = 'strength-success';
        } else if (score >= 60) {
            label = 'Good';
            colorClass = 'strength-primary';
        } else if (score >= 40) {
            label = 'Fair';
            colorClass = 'strength-warning';
        }

        return { score, label, colorClass, rules };
    }
};

window.ui = ui;
document.addEventListener('DOMContentLoaded', () => {
    ui.initPasswordToggles();
});
