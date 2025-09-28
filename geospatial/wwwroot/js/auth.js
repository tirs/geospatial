// Authentication utility functions
class AuthService {
    constructor() {
        this.API_BASE = '/api';
        this.sessionToken = localStorage.getItem('sessionToken');
        this.userRole = localStorage.getItem('userRole');
        this.agentName = localStorage.getItem('agentName');
        this.agentId = localStorage.getItem('agentId');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.sessionToken;
    }

    // Get current user info
    getCurrentUser() {
        return {
            sessionToken: this.sessionToken,
            userRole: this.userRole,
            agentName: this.agentName,
            agentId: this.agentId
        };
    }

    // Check if user has specific role
    hasRole(role) {
        return this.userRole === role;
    }

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        return roles.includes(this.userRole);
    }

    // Validate current session
    async validateSession() {
        if (!this.sessionToken) {
            return false;
        }

        try {
            const response = await fetch(`${this.API_BASE}/Auth/validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.sessionToken}`
                }
            });

            const result = await response.json();
            
            if (result.result === 'VALID') {
                // Update stored user info
                localStorage.setItem('userRole', result.userRole);
                localStorage.setItem('agentName', `${result.firstName} ${result.lastName}`);
                localStorage.setItem('agentId', result.agentId);
                
                this.userRole = result.userRole;
                this.agentName = `${result.firstName} ${result.lastName}`;
                this.agentId = result.agentId;
                
                return true;
            } else {
                this.clearSession();
                return false;
            }
        } catch (error) {
            console.error('Session validation error:', error);
            this.clearSession();
            return false;
        }
    }

    // Logout user
    async logout() {
        try {
            if (this.sessionToken) {
                await fetch(`${this.API_BASE}/Auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.sessionToken}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
            window.location.href = '/login.html';
        }
    }

    // Clear session data
    clearSession() {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('agentName');
        localStorage.removeItem('agentId');
        this.sessionToken = null;
        this.userRole = null;
        this.agentName = null;
        this.agentId = null;
    }

    // Make authenticated API request
    async apiRequest(url, options = {}) {
        if (!this.sessionToken) {
            throw new Error('No session token');
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.sessionToken}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401) {
            // Session expired
            this.clearSession();
            window.location.href = '/login.html';
            throw new Error('Session expired');
        }

        return response;
    }

    // Protect page - redirect to login if not authenticated
    async protectPage(requiredRoles = []) {
        const isValid = await this.validateSession();
        
        if (!isValid) {
            window.location.href = '/login.html';
            return false;
        }

        if (requiredRoles.length > 0 && !this.hasAnyRole(requiredRoles)) {
            // User doesn't have required role
            this.showAccessDenied();
            return false;
        }

        return true;
    }

    // Show access denied message
    showAccessDenied() {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif;">
                <div style="text-align: center; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                    <div style="font-size: 64px; margin-bottom: 20px;">🚫</div>
                    <h1 style="color: #dc2626; margin-bottom: 10px;">Access Denied</h1>
                    <p style="color: #6b7280; margin-bottom: 20px;">You don't have permission to access this page.</p>
                    <button onclick="auth.logout()" style="background: #667eea; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                        Return to Login
                    </button>
                </div>
            </div>
        `;
    }

    // Update user display in UI
    updateUserDisplay() {
        const userNameElements = document.querySelectorAll('.user-name, .agent-name');
        const userRoleElements = document.querySelectorAll('.user-role, .agent-role');
        
        userNameElements.forEach(el => {
            if (this.agentName) {
                el.textContent = this.agentName;
            }
        });
        
        userRoleElements.forEach(el => {
            if (this.userRole) {
                el.textContent = this.userRole;
            }
        });
    }

    // Add logout functionality to logout buttons
    addLogoutHandlers() {
        const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"]');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }

    // Initialize authentication for a page
    async initializePage(requiredRoles = []) {
        const isAuthorized = await this.protectPage(requiredRoles);
        
        if (isAuthorized) {
            this.updateUserDisplay();
            this.addLogoutHandlers();
            
            // Auto-refresh session every 30 minutes
            setInterval(() => {
                this.validateSession();
            }, 30 * 60 * 1000);
        }
        
        return isAuthorized;
    }
}

// Create global auth instance
const auth = new AuthService();

// Role-based access control helpers
const ROLES = {
    AGENT: 'Agent',
    SUPERVISOR: 'Supervisor', 
    MANAGER: 'Manager',
    ADMIN: 'Admin'
};

// Permission groups
const PERMISSIONS = {
    BASIC: [ROLES.AGENT, ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.ADMIN],
    SUPERVISOR: [ROLES.SUPERVISOR, ROLES.MANAGER, ROLES.ADMIN],
    MANAGER: [ROLES.MANAGER, ROLES.ADMIN],
    ADMIN: [ROLES.ADMIN]
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthService, auth, ROLES, PERMISSIONS };
}