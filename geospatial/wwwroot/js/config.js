// Urban Referral Network - Configuration
const CONFIG = {
    // API Configuration - Use relative URLs (no base needed for same-origin requests)
    API_BASE_URL: '',
    
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

// Make CONFIG available globally
window.CONFIG = CONFIG;

// Set API_BASE_URL for backward compatibility
window.API_BASE_URL = CONFIG.API_BASE_URL;

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}