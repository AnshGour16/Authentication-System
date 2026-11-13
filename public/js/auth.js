/**
 * Authentication Service Module
 * Handles session storage, state querying, and route guarding.
 */
const authService = {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'auth_user',

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    getUser() {
        try {
            const raw = localStorage.getItem(this.USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    setSession(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },

    isAuthenticated() {
        return Boolean(this.getToken() && this.getUser());
    },

    isAdmin() {
        const user = this.getUser();
        return Boolean(user && user.role === 'admin');
    },

    requireAuth(allowedRoles = null) {
        const token = this.getToken();
        const user = this.getUser();

        if (!token || !user) {
            window.location.href = 'login.html';
            return null;
        }

        if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
            if (window.ui && window.ui.showToast) {
                window.ui.showToast('Access denied: insufficient permissions', 'error');
            }
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            return null;
        }

        return { token, user };
    },

    logout(redirectUrl = 'login.html') {
        this.clearSession();
        if (window.ui && window.ui.showToast) {
            window.ui.showToast('Session terminated successfully', 'info');
        }
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 500);
    }
};

window.authService = authService;
