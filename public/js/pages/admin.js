/**
 * Administrator Portal Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    const auth = window.authService.requireAuth(['admin']);
    if (!auth) return;

    const currentAdmin = auth.user;

    async function loadStats() {
        const result = await window.apiClient.get('/api/admin/stats');
        if (result.ok && result.data.stats) {
            const s = result.data.stats;
            setCount('stat-total-users', s.totalUsers);
            setCount('stat-active-users', s.activeUsers);
            setCount('stat-admin-users', s.adminCount);
            setCount('stat-new-users', s.newUsers24h);
            setCount('stat-locked-users', s.lockedUsers);
        }
    }

    function setCount(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val !== undefined ? val : 0;
    }

    async function loadUsers(search = '') {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        const endpoint = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users';
        const result = await window.apiClient.get(endpoint);

        if (!result.ok) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">${result.data.message || 'Error fetching user directory.'}</td></tr>`;
            return;
        }

        const users = result.data.users || [];
        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No records found matching query.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => {
            const isSelf = u.id === currentAdmin.id;
            const roleClass = u.role === 'admin' ? 'role-chip-admin' : 'role-chip-user';
            const statusClass = u.isLocked ? 'status-chip-danger' : (u.isActive ? 'status-chip-success' : 'status-chip-danger');
            const statusLabel = u.isLocked ? 'LOCKED' : (u.isActive ? 'ACTIVE' : 'SUSPENDED');

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center gap-3">
                            <div class="table-avatar">${(u.name || 'U').charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="fw-semibold text-primary-content">${u.name} ${isSelf ? '<span class="badge-self">You</span>' : ''}</div>
                                <div class="text-muted small">${u.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="role-chip ${roleClass}">${(u.role || 'user').toUpperCase()}</span>
                    </td>
                    <td>
                        <span class="status-chip ${statusClass}">${statusLabel}</span>
                    </td>
                    <td class="text-muted small font-monospace">
                        ${u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'None'}
                    </td>
                    <td class="text-muted small font-monospace">
                        ${new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td class="text-end">
                        ${isSelf ? '<span class="text-muted small">Protected</span>' : `
                            <div class="btn-group-actions">
                                <button type="button" class="btn-table-action" onclick="window.adminActions.toggleRole('${u.id}', '${u.role === 'admin' ? 'user' : 'admin'}')">
                                    ${u.role === 'admin' ? 'Demote' : 'Promote'}
                                </button>
                                <button type="button" class="btn-table-action" onclick="window.adminActions.toggleStatus('${u.id}', ${!u.isActive})">
                                    ${u.isActive ? 'Suspend' : 'Activate'}
                                </button>
                                <button type="button" class="btn-table-action text-danger" onclick="window.adminActions.deleteUser('${u.id}', '${u.name}')">
                                    Delete
                                </button>
                            </div>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
    }

    async function loadAuditLogs() {
        const tbody = document.getElementById('audit-table-body');
        if (!tbody) return;

        const result = await window.apiClient.get('/api/admin/audit-logs');

        if (!result.ok || !result.data.events || !result.data.events.length) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No audit events logged yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = result.data.events.map(ev => `
            <tr>
                <td class="text-muted small font-monospace">${new Date(ev.timestamp).toLocaleString()}</td>
                <td class="fw-semibold">${ev.userName}</td>
                <td class="text-muted small">${ev.userEmail}</td>
                <td><span class="role-chip ${ev.role === 'admin' ? 'role-chip-admin' : 'role-chip-user'}">${ev.role.toUpperCase()}</span></td>
                <td class="font-monospace small">${ev.ip || '127.0.0.1'}</td>
                <td class="text-muted small">${ev.device}</td>
                <td>
                    <span class="status-chip ${ev.status === 'failed' ? 'status-chip-danger' : 'status-chip-success'}">
                        ${ev.status.toUpperCase()}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // Exposed Administrative Actions
    window.adminActions = {
        async toggleRole(userId, newRole) {
            if (!confirm(`Confirm role update to: ${newRole.toUpperCase()}?`)) return;
            const res = await window.apiClient.patch(`/api/admin/users/${userId}/role`, { role: newRole });
            if (res.ok) {
                window.ui.showToast(res.data.message, 'success');
                loadUsers(document.getElementById('search-users-input').value.trim());
                loadStats();
            } else {
                window.ui.showToast(res.data.message || 'Error updating role', 'error');
            }
        },

        async toggleStatus(userId, newStatus) {
            const action = newStatus ? 'Activate' : 'Suspend';
            if (!confirm(`Confirm ${action} account?`)) return;
            const res = await window.apiClient.patch(`/api/admin/users/${userId}/status`, { isActive: newStatus });
            if (res.ok) {
                window.ui.showToast(res.data.message, 'success');
                loadUsers(document.getElementById('search-users-input').value.trim());
                loadStats();
            } else {
                window.ui.showToast(res.data.message || 'Error updating account status', 'error');
            }
        },

        async deleteUser(userId, userName) {
            if (!confirm(`Confirm permanent deletion of account: '${userName}'? This action is irreversible.`)) return;
            const res = await window.apiClient.delete(`/api/admin/users/${userId}`);
            if (res.ok) {
                window.ui.showToast(res.data.message, 'success');
                loadUsers(document.getElementById('search-users-input').value.trim());
                loadStats();
            } else {
                window.ui.showToast(res.data.message || 'Error deleting account', 'error');
            }
        }
    };

    // Search Input with Debounce
    const searchInput = document.getElementById('search-users-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                loadUsers(e.target.value.trim());
            }, 300);
        });
    }

    // Refresh Action
    const refreshBtn = document.getElementById('btn-refresh-admin');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadStats();
            loadUsers(searchInput ? searchInput.value.trim() : '');
            loadAuditLogs();
            window.ui.showToast('Administrative data refreshed', 'info');
        });
    }

    // Logout Action
    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => window.authService.logout());
    }

    // Initial Load
    loadStats();
    loadUsers();
    loadAuditLogs();
});
