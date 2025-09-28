/**
 * Urban Referral Network - Production-Ready Quick Actions
 * Handles all Quick Action functionality with proper API integration
 */

class QuickActionsManager {
    constructor() {
        this.isInitialized = false;
        this.loadingStates = new Set();
        this.apiBaseUrl = window.API_BASE_URL || '';
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        try {
            this.setupQuickActions();
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ Quick Actions Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Quick Actions Manager:', error);
        }
    }

    setupQuickActions() {
        // Find all quick action buttons and attach proper handlers
        const quickActionButtons = document.querySelectorAll('.action-card');
        
        quickActionButtons.forEach(button => {
            // Remove old onclick handlers
            button.removeAttribute('onclick');
            
            // Get action type from the button content
            const actionTitle = button.querySelector('.action-title')?.textContent?.trim();
            
            if (!actionTitle) return;
            
            // Add new event listeners based on action type
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleQuickAction(actionTitle, button);
            });
        });

        // Also create global functions for backward compatibility
        this.createGlobalFunctions();
    }

    setupEventListeners() {
        // Listen for dashboard initialization
        document.addEventListener('DOMContentLoaded', () => {
            if (!this.isInitialized) {
                this.init();
            }
        });
    }

    createGlobalFunctions() {
        // Create global functions for backward compatibility
        window.showContractorFinder = () => this.findContractors();
        window.createReferral = () => this.createReferral();
        window.viewReports = () => this.viewReports();
        window.manageContractors = () => this.manageContractors();
    }

    async handleQuickAction(actionTitle, buttonElement) {
        const actionKey = actionTitle.replace(/\s+/g, '');
        
        // Prevent multiple simultaneous executions of the same action
        if (this.isLoading(actionKey)) {
            this.showNotification('⏳ Action already in progress...', 'warning');
            return;
        }

        try {
            // Set loading state
            this.setLoading(actionKey, true);
            
            // Add visual feedback
            this.addButtonFeedback(buttonElement);
            this.addLoadingState(buttonElement);
            
            // Handle different actions with timeout protection
            const actionPromise = this.executeAction(actionTitle);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Action timed out')), 30000)
            );
            
            await Promise.race([actionPromise, timeoutPromise]);
            
        } catch (error) {
            console.error('❌ Quick action failed:', error);
            
            // Provide specific error messages
            let errorMessage = 'Action failed';
            if (error.message.includes('timeout')) {
                errorMessage = 'Action timed out - please try again';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error - please check your connection';
            } else if (error.message.includes('not available')) {
                errorMessage = 'System not ready - please refresh the page';
            } else {
                errorMessage = `Action failed: ${error.message}`;
            }
            
            this.showNotification(errorMessage, 'error');
        } finally {
            // Clean up loading state
            this.setLoading(actionKey, false);
            this.removeLoadingState(buttonElement);
        }
    }

    async executeAction(actionTitle) {
        switch (actionTitle) {
            case 'Find Contractors':
                await this.findContractors();
                break;
            case 'Create Referral':
                await this.createReferral();
                break;
            case 'View Reports':
                await this.viewReports();
                break;
            case 'Manage Contractors':
                await this.manageContractors();
                break;
            default:
                throw new Error(`Unknown action: ${actionTitle}`);
        }
    }

    addButtonFeedback(button) {
        // Add visual feedback to show button was clicked
        if (button) {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
        }
    }

    addLoadingState(button) {
        if (button) {
            // Store original content
            if (!button.dataset.originalContent) {
                button.dataset.originalContent = button.innerHTML;
            }
            
            // Add loading state
            button.style.opacity = '0.7';
            button.style.pointerEvents = 'none';
            
            const actionIcon = button.querySelector('.action-icon');
            if (actionIcon) {
                actionIcon.style.animation = 'spin 1s linear infinite';
            }
        }
    }

    removeLoadingState(button) {
        if (button) {
            // Restore original state
            if (button.dataset.originalContent) {
                button.innerHTML = button.dataset.originalContent;
                delete button.dataset.originalContent;
            }
            
            button.style.opacity = '';
            button.style.pointerEvents = '';
            
            const actionIcon = button.querySelector('.action-icon');
            if (actionIcon) {
                actionIcon.style.animation = '';
            }
        }
    }

    // =================================
    // 🔍 FIND CONTRACTORS FUNCTIONALITY
    // =================================
    async findContractors() {
        console.log('🔍 Executing Find Contractors quick action...');
        
        try {
            // Show loading notification
            this.showNotification('🔍 Opening contractor finder...', 'info');
            
            // Navigate to contractor finder section
            if (window.dashboard) {
                window.dashboard.showSection('contractor-finder');
                window.dashboard.setActiveMenuItem(document.querySelector('[data-section="contractor-finder"]'));
                
                // Initialize contractor finder if available
                if (window.dashboard.contractorFinder) {
                    window.dashboard.contractorFinder.resetSelection();
                }
                
                // Focus on ZIP code input for immediate use
                setTimeout(() => {
                    const zipCodeInput = document.getElementById('zipCode');
                    if (zipCodeInput) {
                        zipCodeInput.focus();
                        zipCodeInput.select();
                    }
                }, 300);
                
                this.showNotification('✅ Contractor finder ready', 'success');
            } else {
                throw new Error('Dashboard not available');
            }
        } catch (error) {
            console.error('❌ Find Contractors failed:', error);
            this.showNotification('Failed to open contractor finder', 'error');
        }
    }

    // Validate ZIP code using the API
    async validateZipCode(zipCode) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Referral/validate-zipcode/${zipCode}`);
            const data = await response.json();
            return data.isValid || false;
        } catch (error) {
            console.error('ZIP validation failed:', error);
            return false;
        }
    }

    // Search for contractors using the API
    async searchContractors(criteria) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Referral/find-contractors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(criteria)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Contractor search failed:', error);
            throw error;
        }
    }

    // =================================
    // 📋 CREATE REFERRAL FUNCTIONALITY  
    // =================================
    async createReferral() {
        console.log('📋 Executing Create Referral quick action...');
        
        try {
            // Show loading notification
            this.showNotification('📋 Opening referral creation...', 'info');
            
            // Navigate to contractor finder section (where referrals are created)
            if (window.dashboard) {
                window.dashboard.showSection('contractor-finder');
                window.dashboard.setActiveMenuItem(document.querySelector('[data-section="contractor-finder"]'));
                
                // Reset contractor selection for fresh start
                if (window.dashboard.contractorFinder) {
                    window.dashboard.contractorFinder.resetSelection();
                }
                
                // Scroll to referral form and focus on customer name
                setTimeout(() => {
                    const referralPanel = document.getElementById('referralPanel');
                    if (referralPanel) {
                        referralPanel.scrollIntoView({ behavior: 'smooth' });
                        
                        // Focus on customer name field
                        setTimeout(() => {
                            const customerNameField = document.getElementById('customerName');
                            if (customerNameField) {
                                customerNameField.focus();
                            }
                        }, 500);
                    }
                }, 300);
                
                this.showNotification('✅ Referral form ready - please search for contractors first', 'success');
            } else {
                throw new Error('Dashboard not available');
            }
        } catch (error) {
            console.error('❌ Create Referral failed:', error);
            this.showNotification('Failed to open referral creation', 'error');
        }
    }

    // Submit referral using the API
    async submitReferral(referralData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Referral/create-referral`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(referralData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Referral submission failed:', error);
            throw error;
        }
    }

    // =================================
    // 📊 VIEW REPORTS FUNCTIONALITY
    // =================================
    async viewReports() {
        console.log('📊 Executing View Reports quick action...');
        
        try {
            // Show loading notification
            this.showNotification('📊 Loading analytics and reports...', 'info');
            
            // Navigate to analytics section
            if (window.dashboard) {
                window.dashboard.showSection('analytics');
                window.dashboard.setActiveMenuItem(document.querySelector('[data-section="analytics"]'));
                
                // Initialize analytics manager if available
                if (window.analyticsManager) {
                    await window.analyticsManager.initialize();
                } else if (window.dashboard.loadAnalyticsData) {
                    // Fallback to dashboard analytics
                    await window.dashboard.loadAnalyticsData();
                }
                
                this.showNotification('✅ Analytics and reports loaded', 'success');
            } else {
                throw new Error('Dashboard not available');
            }
        } catch (error) {
            console.error('❌ View Reports failed:', error);
            this.showNotification('Failed to load reports', 'error');
        }
    }

    // Load analytics data from API
    async loadAnalyticsData() {
        try {
            // Get overview data
            const overviewResponse = await fetch(`${this.apiBaseUrl}/api/DataSummary/overview`);
            const overviewData = await overviewResponse.json();
            
            // You can add more analytics endpoints here
            return overviewData;
        } catch (error) {
            console.error('Analytics data loading failed:', error);
            throw error;
        }
    }

    // =================================
    // 👷 MANAGE CONTRACTORS FUNCTIONALITY
    // =================================
    async manageContractors() {
        console.log('👷 Executing Manage Contractors quick action...');
        
        try {
            // Show loading notification
            this.showNotification('👷 Loading contractor management...', 'info');
            
            // Navigate to contractors section
            if (window.dashboard) {
                window.dashboard.showSection('contractors');
                window.dashboard.setActiveMenuItem(document.querySelector('[data-section="contractors"]'));
                
                // Initialize contractor manager if available
                if (window.contractorManager) {
                    await window.contractorManager.initialize();
                } else if (window.dashboard.loadContractors) {
                    // Fallback to dashboard contractors
                    await window.dashboard.loadContractors();
                }
                
                this.showNotification('✅ Contractor management loaded', 'success');
            } else {
                throw new Error('Dashboard not available');
            }
        } catch (error) {
            console.error('❌ Manage Contractors failed:', error);
            this.showNotification('Failed to load contractor management', 'error');
        }
    }

    // Get all contractors from API
    async getAllContractors() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Contractor`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.contractors || [];
        } catch (error) {
            console.error('Get contractors failed:', error);
            throw error;
        }
    }

    // Get pending contractors from API
    async getPendingContractors() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Contractor/pending`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.contractors || [];
        } catch (error) {
            console.error('Get pending contractors failed:', error);
            throw error;
        }
    }

    // Update contractor status
    async updateContractorStatus(contractorId, isActive) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Contractor/${contractorId}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Update contractor status failed:', error);
            throw error;
        }
    }

    // Approve/Reject contractor
    async approveContractor(contractorId, approved, notes = '') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Contractor/${contractorId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    approved: approved,
                    notes: notes,
                    approvedBy: localStorage.getItem('agentName') || 'System'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Approve contractor failed:', error);
            throw error;
        }
    }

    // =================================
    // 🔧 UTILITY FUNCTIONS
    // =================================

    showNotification(message, type = 'info', duration = 3000) {
        // Try to use dashboard notification system if available
        if (window.dashboard && window.dashboard.showNotification) {
            window.dashboard.showNotification(message, type);
            return;
        }

        // Fallback notification system
        console.log(`${this.getNotificationIcon(type)} ${message}`);
        
        // Create notification element if not exists
        let notification = document.getElementById('quick-action-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'quick-action-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(notification);
        }

        // Set notification style based on type
        const colors = {
            'success': '#4CAF50',
            'error': '#F44336',
            'warning': '#FF9800',
            'info': '#2196F3'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        // Show notification
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';

        // Hide notification after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Check if loading state is active
    isLoading(action) {
        return this.loadingStates.has(action);
    }

    // Set loading state
    setLoading(action, loading = true) {
        if (loading) {
            this.loadingStates.add(action);
        } else {
            this.loadingStates.delete(action);
        }
    }

    // =================================
    // 🧪 TESTING AND DEBUG FUNCTIONS
    // =================================

    async testAllQuickActions() {
        console.log('🧪 Testing all Quick Actions...');
        
        const testResults = {
            findContractors: false,
            createReferral: false,
            viewReports: false,
            manageContractors: false
        };

        // Test Find Contractors
        try {
            await this.findContractors();
            testResults.findContractors = true;
            console.log('✅ Find Contractors test passed');
        } catch (error) {
            console.log('❌ Find Contractors test failed:', error.message);
        }

        // Test Create Referral
        try {
            await this.createReferral();
            testResults.createReferral = true;
            console.log('✅ Create Referral test passed');
        } catch (error) {
            console.log('❌ Create Referral test failed:', error.message);
        }

        // Test View Reports
        try {
            await this.viewReports();
            testResults.viewReports = true;
            console.log('✅ View Reports test passed');
        } catch (error) {
            console.log('❌ View Reports test failed:', error.message);
        }

        // Test Manage Contractors
        try {
            await this.manageContractors();
            testResults.manageContractors = true;
            console.log('✅ Manage Contractors test passed');
        } catch (error) {
            console.log('❌ Manage Contractors test failed:', error.message);
        }

        // Report results
        const passedTests = Object.values(testResults).filter(r => r).length;
        const totalTests = Object.keys(testResults).length;
        
        console.log(`🧪 Quick Actions Test Results: ${passedTests}/${totalTests} passed`);
        console.table(testResults);

        return testResults;
    }

    // Health check for Quick Actions
    healthCheck() {
        const health = {
            initialized: this.isInitialized,
            dashboardAvailable: !!window.dashboard,
            apiBaseUrl: this.apiBaseUrl,
            activeLoadingStates: Array.from(this.loadingStates),
            globalFunctionsAvailable: {
                showContractorFinder: typeof window.showContractorFinder === 'function',
                createReferral: typeof window.createReferral === 'function',
                viewReports: typeof window.viewReports === 'function',
                manageContractors: typeof window.manageContractors === 'function'
            }
        };

        console.log('🏥 Quick Actions Health Check:', health);
        return health;
    }
}

// Initialize Quick Actions Manager
const quickActionsManager = new QuickActionsManager();

// Export for global access
window.quickActionsManager = quickActionsManager;

// Export individual functions for backward compatibility

window.quickActionsHealthCheck = () => quickActionsManager.healthCheck();

console.log('🚀 Quick Actions Production System loaded successfully!');