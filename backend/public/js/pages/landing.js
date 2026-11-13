/**
 * Landing Page Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    const authActions = document.getElementById('nav-auth-actions');
    if (!authActions) return;

    if (window.authService && window.authService.isAuthenticated()) {
        const user = window.authService.getUser();
        const isAdmin = user && user.role === 'admin';
        const targetUrl = isAdmin ? 'admin.html' : 'dashboard.html';
        const roleLabel = isAdmin ? 'Administrator' : 'Dashboard';

        authActions.innerHTML = `
            <a href="${targetUrl}" class="btn-primary-sm">
                <i class="bi bi-${isAdmin ? 'shield-lock' : 'person-circle'}"></i>
                <span>${user.name || 'Account'} (${roleLabel})</span>
            </a>
            <button type="button" id="landing-logout-btn" class="btn-outline-sm">
                <i class="bi bi-box-arrow-right"></i>
                <span>Sign Out</span>
            </button>
        `;

        document.getElementById('landing-logout-btn').addEventListener('click', () => {
            window.authService.logout('index.html');
        });
    }
});
