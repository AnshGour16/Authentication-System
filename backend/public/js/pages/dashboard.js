/**
 * User Dashboard Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    const auth = window.authService.requireAuth();
    if (!auth) return;

    let currentUser = auth.user;
    const token = auth.token;

    function renderUserContext() {
        const sideName = document.getElementById('user-side-name');
        const sideEmail = document.getElementById('user-side-email');
        const sideAvatar = document.getElementById('user-side-avatar');
        const sideRoleChip = document.getElementById('user-side-role');
        const greetingName = document.getElementById('dash-greeting-name');
        const kpiRole = document.getElementById('kpi-role-value');
        const adminLink = document.getElementById('admin-nav-item');

        const roleText = (currentUser.role || 'user').toUpperCase();

        if (sideName) sideName.textContent = currentUser.name || 'User';
        if (sideEmail) sideEmail.textContent = currentUser.email || '';
        if (sideAvatar) sideAvatar.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
        if (greetingName) greetingName.textContent = currentUser.name || 'User';
        if (kpiRole) kpiRole.textContent = roleText;

        if (sideRoleChip) {
            sideRoleChip.textContent = roleText;
            sideRoleChip.className = currentUser.role === 'admin' ? 'role-chip role-chip-admin' : 'role-chip role-chip-user';
        }

        if (adminLink) {
            if (currentUser.role === 'admin') {
                adminLink.classList.remove('d-none');
            } else {
                adminLink.classList.add('d-none');
            }
        }

        // Profile Form Inputs
        const editName = document.getElementById('profile-input-name');
        const editEmail = document.getElementById('profile-input-email');
        const editRole = document.getElementById('profile-input-role');

        if (editName) editName.value = currentUser.name || '';
        if (editEmail) editEmail.value = currentUser.email || '';
        if (editRole) editRole.value = roleText;

        // JWT Previews
        const jwtPreview = document.getElementById('jwt-token-preview');
        const decodedPreview = document.getElementById('jwt-claims-preview');

        if (jwtPreview) jwtPreview.textContent = token;

        if (decodedPreview) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                decodedPreview.textContent = JSON.stringify(JSON.parse(jsonPayload), null, 2);
            } catch (err) {
                decodedPreview.textContent = JSON.stringify({ error: 'Unable to decode token claims' }, null, 2);
            }
        }
    }

    renderUserContext();

    // Tab Navigation
    const navButtons = document.querySelectorAll('.dash-nav-btn[data-target]');
    const tabPanels = document.querySelectorAll('.dash-tab-panel');

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');

            navButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => {
                p.classList.remove('active');
                p.classList.remove('d-none');
            });

            btn.classList.add('active');
            const panel = document.getElementById(targetId);
            if (panel) {
                panel.classList.remove('d-none');
                panel.classList.add('active');
            }

            if (targetId === 'tab-security') {
                loadSessionHistory();
            }
        });
    });

    // Copy JWT Action
    const copyBtn = document.getElementById('btn-copy-jwt');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(token);
            window.ui.showToast('JWT token copied to clipboard', 'info');
        });
    }

    // Live API Tester
    const testApiBtn = document.getElementById('btn-test-profile-api');
    const testOutput = document.getElementById('api-test-output');
    if (testApiBtn && testOutput) {
        testApiBtn.addEventListener('click', async () => {
            testOutput.textContent = '// Dispatching HTTP GET /api/auth/profile with Bearer Token...';
            const result = await window.apiClient.get('/api/auth/profile');
            testOutput.textContent = `// Response Status: ${result.status}\n` + JSON.stringify(result.data, null, 2);
            if (result.ok) {
                window.ui.showToast('Protected endpoint call succeeded (HTTP 200)', 'success');
            } else {
                window.ui.showToast('Protected endpoint returned error', 'error');
            }
        });
    }

    // Profile Update Form
    const profileForm = document.getElementById('form-update-profile');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('profile-input-name').value.trim();
            const btn = document.getElementById('btn-save-profile');

            if (!name) {
                window.ui.showToast('Display name cannot be empty', 'error');
                return;
            }

            window.ui.setLoading(btn, true, 'Saving...');

            const result = await window.apiClient.put('/api/auth/profile', { name });

            window.ui.setLoading(btn, false, 'Save Profile Changes');

            if (result.ok) {
                currentUser.name = name;
                window.authService.setSession(token, currentUser);
                renderUserContext();
                window.ui.showToast('Profile updated successfully', 'success');
            } else {
                window.ui.showToast(result.data.message || 'Error updating profile', 'error');
            }
        });
    }

    // Change Password Form
    const pwdForm = document.getElementById('form-change-password');
    if (pwdForm) {
        pwdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('pwd-current').value;
            const newPassword = document.getElementById('pwd-new').value;
            const confirmPassword = document.getElementById('pwd-confirm').value;
            const btn = document.getElementById('btn-change-pwd');

            if (!currentPassword || !newPassword || !confirmPassword) {
                window.ui.showToast('All password fields are required', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                window.ui.showToast('New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                window.ui.showToast('New password must contain at least 6 characters', 'error');
                return;
            }

            window.ui.setLoading(btn, true, 'Updating...');

            const result = await window.apiClient.post('/api/auth/change-password', {
                currentPassword,
                newPassword
            });

            window.ui.setLoading(btn, false, 'Update Password');

            if (result.ok) {
                window.ui.showToast('Password changed successfully', 'success');
                pwdForm.reset();
            } else {
                window.ui.showToast(result.data.message || 'Error changing password', 'error');
            }
        });
    }

    // Session History Loader
    async function loadSessionHistory() {
        const tbody = document.getElementById('sessions-table-body');
        const activeIp = document.getElementById('active-session-ip');
        const activeDevice = document.getElementById('active-session-device');

        if (!tbody) return;

        const result = await window.apiClient.get('/api/auth/sessions');

        if (result.ok && result.data.sessions) {
            const current = result.data.sessions.current || {};
            if (activeIp) activeIp.textContent = current.ip || '127.0.0.1';
            if (activeDevice) activeDevice.textContent = current.device || 'Browser';

            const history = result.data.sessions.history || [];
            if (!history.length) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No recorded security events.</td></tr>`;
                return;
            }

            tbody.innerHTML = history.map(item => `
                <tr>
                    <td class="text-muted font-monospace">${new Date(item.timestamp).toLocaleString()}</td>
                    <td class="font-monospace">${item.ip || '127.0.0.1'}</td>
                    <td class="text-muted">${item.device || 'Browser'}</td>
                    <td>
                        <span class="status-chip ${item.status === 'failed' ? 'status-chip-danger' : 'status-chip-success'}">
                            ${item.status.toUpperCase()}
                        </span>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-3">Failed to load session history.</td></tr>`;
        }
    }

    const refreshSessionsBtn = document.getElementById('btn-refresh-sessions');
    if (refreshSessionsBtn) {
        refreshSessionsBtn.addEventListener('click', loadSessionHistory);
    }

    // Logout Handlers
    const logoutBtn = document.getElementById('btn-dashboard-logout');
    const topLogoutBtn = document.getElementById('btn-top-logout');

    if (logoutBtn) logoutBtn.addEventListener('click', () => window.authService.logout());
    if (topLogoutBtn) topLogoutBtn.addEventListener('click', () => window.authService.logout());
});
