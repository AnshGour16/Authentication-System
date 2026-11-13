/**
 * Interactive API Documentation Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    const tokenInput = document.getElementById('docs-bearer-token');
    const autoTokenBtn = document.getElementById('btn-auto-populate-token');

    if (tokenInput && window.authService) {
        const activeToken = window.authService.getToken();
        if (activeToken) tokenInput.value = activeToken;
    }

    if (autoTokenBtn && tokenInput) {
        autoTokenBtn.addEventListener('click', () => {
            const t = window.authService.getToken();
            if (t) {
                tokenInput.value = t;
                window.ui.showToast('Active session token attached', 'success');
            } else {
                window.ui.showToast('No active session token found. Please sign in.', 'error');
            }
        });
    }

    // Toggle Endpoint Cards
    window.toggleEndpointCard = (id) => {
        const body = document.getElementById(id);
        if (body) {
            body.classList.toggle('d-none');
        }
    };

    // Live API Execution Handler
    window.executeApiCall = async (endpoint, method, bodyElementId, outputElementId, isProtected) => {
        const output = document.getElementById(outputElementId);
        if (!output) return;

        output.classList.remove('d-none');
        output.textContent = `// Dispatching ${method} ${endpoint}...`;

        const options = {
            method,
            headers: {}
        };

        if (isProtected) {
            const token = tokenInput ? tokenInput.value.trim() : '';
            if (!token) {
                output.textContent = '// ERROR: This is a protected endpoint. Please provide a Bearer token above.';
                window.ui.showToast('Bearer token required', 'error');
                return;
            }
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (bodyElementId) {
            const bodyEl = document.getElementById(bodyElementId);
            try {
                options.body = JSON.parse(bodyEl.value);
            } catch (err) {
                output.textContent = '// ERROR: Invalid JSON format in request payload textarea.';
                window.ui.showToast('Malformed JSON payload', 'error');
                return;
            }
        }

        const startTime = performance.now();
        const result = await window.apiClient.request(endpoint, options);
        const duration = Math.round(performance.now() - startTime);

        output.textContent = `// HTTP Status: ${result.status} (${duration}ms)\n` + JSON.stringify(result.data, null, 2);

        if (result.ok) {
            window.ui.showToast(`${method} ${endpoint} -> ${result.status} (${duration}ms)`, 'success');
        } else {
            window.ui.showToast(`${method} ${endpoint} -> ${result.status} Error`, 'error');
        }
    };
});
