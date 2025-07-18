// Urban Referral Network - Configuration
const CONFIG = {
    // API Configuration - Auto-detect environment and path
    API_BASE_URL: (() => {
        const isLocal = window.location.hostname === 'localhost';
        const isCustomDomain = window.location.hostname === 'urbanreferralnetwork.com';
        const isSubApp = window.location.pathname.startsWith('/geospatial');
        
        // Set base path based on deployment
        let basePath = '';
        if (isCustomDomain && isSubApp) {
            basePath = '/geospatial';
        }
        
        return `${basePath}/api/referral`;
    })(),
    
    // Base path for navigation
    BASE_PATH: (() => {
        const isCustomDomain = window.location.hostname === 'urbanreferralnetwork.com';
        const isSubApp = window.location.pathname.startsWith('/geospatial');
        return (isCustomDomain && isSubApp) ? '/geospatial' : '';
    })(),
    
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

// Helper function for navigation with correct base path
window.navigateTo = function(path) {
    const isCustomDomain = window.location.hostname === 'urbanreferralnetwork.com';
    const isSubApp = window.location.pathname.startsWith('/geospatial');
    const basePath = (isCustomDomain && isSubApp) ? '/geospatial' : '';
    window.location.href = `${basePath}${path}`;
};

// Helper function to get URL with correct base path
window.getUrl = function(path) {
    const isCustomDomain = window.location.hostname === 'urbanreferralnetwork.com';
    const isSubApp = window.location.pathname.startsWith('/geospatial');
    const basePath = (isCustomDomain && isSubApp) ? '/geospatial' : '';
    return `${basePath}${path}`;
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}