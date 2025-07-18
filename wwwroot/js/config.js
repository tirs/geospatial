// Urban Referral Network - Configuration
const CONFIG = {
    // API Configuration - Auto-detect environment and path
    API_BASE_URL: (() => {
        const isLocal = window.location.hostname === 'localhost';
        // For Render deployment, no base path needed
        const basePath = '';
        return `${basePath}/api/referral`;
    })(),
    
    // Base path for navigation
    BASE_PATH: '',
    
    // Environment detection
    ENVIRONMENT: window.location.hostname === 'localhost' ? 'development' : 'production',
    
    // Default settings
    DEFAULT_MAX_DISTANCE: 25,
    DEFAULT_MAX_RESULTS: 3,
    
    // Validation patterns
    ZIP_CODE_PATTERN: /^\d{5}(-\d{4})?$/,
    PHONE_PATTERN: /^\(\d{3}\)\s\d{3}-\d{4}$/,
    
    // UI Settings
    NOTIFICATION_TIMEOUT: 5000,
    LOADING_TIMEOUT: 30000
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}