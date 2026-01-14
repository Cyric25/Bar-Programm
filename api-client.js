/**
 * FOS Bar - API Client
 * Zentrale Funktionen für API-Kommunikation
 */

const API_BASE = 'api/';

/**
 * GET-Request an die API
 */
async function apiGet(action) {
    try {
        const response = await fetch(`${API_BASE}?action=${action}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API-Fehler');
        }
        return await response.json();
    } catch (error) {
        console.error(`API GET ${action} fehlgeschlagen:`, error);
        throw error;
    }
}

/**
 * POST-Request an die API
 */
async function apiPost(action, data) {
    try {
        const response = await fetch(`${API_BASE}?action=${action}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API-Fehler');
        }
        return await response.json();
    } catch (error) {
        console.error(`API POST ${action} fehlgeschlagen:`, error);
        throw error;
    }
}

/**
 * DELETE-Request an die API
 */
async function apiDelete(action, id) {
    try {
        const response = await fetch(`${API_BASE}?action=${action}&id=${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API-Fehler');
        }
        return await response.json();
    } catch (error) {
        console.error(`API DELETE ${action} fehlgeschlagen:`, error);
        throw error;
    }
}

/**
 * API-Status prüfen
 */
async function apiCheckStatus() {
    try {
        const result = await apiGet('status');
        return result.status === 'ok';
    } catch (error) {
        return false;
    }
}

// Export für Module (falls benötigt)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiGet, apiPost, apiDelete, apiCheckStatus };
}
