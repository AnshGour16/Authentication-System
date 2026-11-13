/**
 * API Client Module
 * Handles REST communication with centralized Bearer token injection and error handling.
 */
const apiClient = {
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = localStorage.getItem('auth_token');
        if (token && !headers['Authorization']) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            let data = null;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = { message: await response.text() };
            }

            return {
                ok: response.ok,
                status: response.status,
                data
            };
        } catch (error) {
            console.error(`API Error [${options.method || 'GET'} ${url}]:`, error);
            return {
                ok: false,
                status: 0,
                data: { message: error.message || 'Network connection error' }
            };
        }
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'POST', body });
    },

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PUT', body });
    },

    patch(endpoint, body, options = {}) {
        return this.request(endpoint, { ...options, method: 'PATCH', body });
    },

    delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' });
    }
};

window.apiClient = apiClient;
