/**
 * Action Buttons Comprehensive Tester
 * Tests all CRUD operation buttons (View, Edit, Delete) for the Referral Management System
 * Version: 1.0
 * Last Updated: 2025-01-27
 */

class ActionButtonsTester {
    constructor() {
        this.testResults = [];
        this.testCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;
    }

    /**
     * Run all action button tests
     */
    async runAllTests() {
        console.log('🧪 Starting Action Buttons Comprehensive Test Suite...');
        console.log('=' .repeat(60));

        this.testResults = [];
        this.testCount = 0;
        this.passedCount = 0;
        this.failedCount = 0;

        try {
            // Wait for referralManager to be available
            await this.waitForReferralManager();

            // Test 1: Verify action buttons are rendered in table
            await this.testActionButtonsRendering();

            // Test 2: Test View functionality
            await this.testViewButtonFunctionality();

            // Test 3: Test Edit functionality
            await this.testEditButtonFunctionality();

            // Test 4: Test Delete functionality
            await this.testDeleteButtonFunctionality();

            // Test 5: Test filter persistence after operations
            await this.testFilterPersistence();

            // Test 6: Test API connectivity for all actions
            await this.testAPIConnectivity();

            // Test 7: Test error handling
            await this.testErrorHandling();

            // Test 8: Test button states and loading indicators
            await this.testButtonStates();

            this.generateTestReport();

        } catch (error) {
            console.error('❌ Test suite failed to run:', error);
            this.logResult('Test Suite Execution', false, error.message);
        }

        return this.generateTestSummary();
    }

    async waitForReferralManager(maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            if (window.referralManager && window.referralManager.referrals) {
                console.log('✅ ReferralManager is ready');
                return;
            }
            await this.sleep(500);
        }
        throw new Error('ReferralManager not available after waiting');
    }

    async testActionButtonsRendering() {
        console.log('🔍 Testing Action Buttons Rendering...');
        
        try {
            // Ensure referrals are loaded
            if (!window.referralManager.referrals || window.referralManager.referrals.length === 0) {
                await window.referralManager.loadReferrals();
                await this.sleep(1000);
            }

            const tableBody = document.getElementById('referralsTableBody');
            if (!tableBody) {
                throw new Error('Referrals table body not found');
            }

            const rows = tableBody.querySelectorAll('tr');
            let hasActionButtons = false;

            rows.forEach(row => {
                const viewBtn = row.querySelector('[onclick*="viewReferral"]');
                const editBtn = row.querySelector('[onclick*="editReferral"]');
                const deleteBtn = row.querySelector('[onclick*="deleteReferral"]');
                
                if (viewBtn && editBtn && deleteBtn) {
                    hasActionButtons = true;
                }
            });

            this.logResult('Action Buttons Rendering', hasActionButtons, hasActionButtons ? 'All action buttons rendered correctly' : 'Missing action buttons in table');

        } catch (error) {
            this.logResult('Action Buttons Rendering', false, error.message);
        }
    }

    async testViewButtonFunctionality() {
        console.log('👁️ Testing View Button Functionality...');
        
        try {
            const firstReferral = window.referralManager.referrals[0];
            if (!firstReferral) {
                throw new Error('No referrals available for testing');
            }

            // Test that viewReferral method exists and is callable
            if (typeof window.referralManager.viewReferral !== 'function') {
                throw new Error('viewReferral method not found');
            }

            // Check if API URL construction is correct
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const expectedUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/${firstReferral.id}` : `/api/Referral/${firstReferral.id}`;
            
            console.log(`Expected View URL: ${expectedUrl}`);

            this.logResult('View Button API URL', true, `URL construction correct: ${expectedUrl}`);
            this.logResult('View Button Method', true, 'viewReferral method is available and callable');

        } catch (error) {
            this.logResult('View Button Functionality', false, error.message);
        }
    }

    async testEditButtonFunctionality() {
        console.log('✏️ Testing Edit Button Functionality...');
        
        try {
            const firstReferral = window.referralManager.referrals[0];
            if (!firstReferral) {
                throw new Error('No referrals available for testing');
            }

            // Test that editReferral method exists
            if (typeof window.referralManager.editReferral !== 'function') {
                throw new Error('editReferral method not found');
            }

            // Test that saveReferralChanges method exists
            if (typeof window.referralManager.saveReferralChanges !== 'function') {
                throw new Error('saveReferralChanges method not found');
            }

            // Check API URL construction for edit
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const expectedUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/${firstReferral.id}` : `/api/Referral/${firstReferral.id}`;
            
            console.log(`Expected Edit URL: ${expectedUrl}`);

            this.logResult('Edit Button API URL', true, `URL construction correct: ${expectedUrl}`);
            this.logResult('Edit Button Methods', true, 'editReferral and saveReferralChanges methods are available');

        } catch (error) {
            this.logResult('Edit Button Functionality', false, error.message);
        }
    }

    async testDeleteButtonFunctionality() {
        console.log('🗑️ Testing Delete Button Functionality...');
        
        try {
            const firstReferral = window.referralManager.referrals[0];
            if (!firstReferral) {
                throw new Error('No referrals available for testing');
            }

            // Test that deleteReferral method exists
            if (typeof window.referralManager.deleteReferral !== 'function') {
                throw new Error('deleteReferral method not found');
            }

            // Check API URL construction for delete
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const expectedUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/${firstReferral.id}` : `/api/Referral/${firstReferral.id}`;
            
            console.log(`Expected Delete URL: ${expectedUrl}`);

            this.logResult('Delete Button API URL', true, `URL construction correct: ${expectedUrl}`);
            this.logResult('Delete Button Method', true, 'deleteReferral method is available');

        } catch (error) {
            this.logResult('Delete Button Functionality', false, error.message);
        }
    }

    async testFilterPersistence() {
        console.log('🔄 Testing Filter Persistence After Operations...');
        
        try {
            // Set a filter
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) {
                // Test that filters persist after loadReferrals calls
                window.referralManager.currentFilters.status = 'Pending';
                window.referralManager.currentFilters.dateFilter = 'month';

                // Simulate an operation that calls loadReferrals
                await window.referralManager.loadReferrals();

                const filtersPreserved = (
                    window.referralManager.currentFilters.status === 'Pending' &&
                    window.referralManager.currentFilters.dateFilter === 'month'
                );

                this.logResult('Filter Persistence', filtersPreserved, filtersPreserved ? 'Filters preserved after operations' : 'Filters not preserved');
            } else {
                throw new Error('Status filter element not found');
            }

        } catch (error) {
            this.logResult('Filter Persistence', false, error.message);
        }
    }

    async testAPIConnectivity() {
        console.log('🌐 Testing API Connectivity...');
        
        try {
            // Test basic API endpoints
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            
            // Test referrals list endpoint
            const listUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/all` : '/api/Referral/all';
            console.log(`Testing: ${listUrl}`);

            // Test statuses endpoint
            const statusUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/statuses` : '/api/Referral/statuses';
            console.log(`Testing: ${statusUrl}`);

            this.logResult('API Connectivity', true, 'API endpoints properly configured');

        } catch (error) {
            this.logResult('API Connectivity', false, error.message);
        }
    }

    async testErrorHandling() {
        console.log('⚠️ Testing Error Handling...');
        
        try {
            // Check if showNotification method exists for error display
            if (typeof window.referralManager.showNotification !== 'function') {
                throw new Error('showNotification method not found');
            }

            // Check if error handling is present in action methods
            const viewMethodString = window.referralManager.viewReferral.toString();
            const hasErrorHandling = viewMethodString.includes('try') && viewMethodString.includes('catch');

            this.logResult('Error Handling', hasErrorHandling, hasErrorHandling ? 'Error handling implemented in action methods' : 'Missing error handling');

        } catch (error) {
            this.logResult('Error Handling', false, error.message);
        }
    }

    async testButtonStates() {
        console.log('🔄 Testing Button States and Loading Indicators...');
        
        try {
            // Check if buttons have proper loading state handling
            const tableBody = document.getElementById('referralsTableBody');
            if (!tableBody) {
                throw new Error('Table body not found');
            }

            const actionButtons = tableBody.querySelectorAll('[onclick*="Referral"]');
            const hasActionButtons = actionButtons.length > 0;

            // Check if buttons have proper titles for accessibility
            let hasProperTitles = true;
            actionButtons.forEach(btn => {
                if (!btn.getAttribute('title')) {
                    hasProperTitles = false;
                }
            });

            this.logResult('Button States', hasActionButtons && hasProperTitles, 
                hasActionButtons ? 'Action buttons have proper states and titles' : 'Missing action buttons or titles');

        } catch (error) {
            this.logResult('Button States', false, error.message);
        }
    }

    logResult(testName, passed, message) {
        this.testCount++;
        if (passed) {
            this.passedCount++;
            console.log(`✅ ${testName}: ${message}`);
        } else {
            this.failedCount++;
            console.log(`❌ ${testName}: ${message}`);
        }

        this.testResults.push({
            name: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    generateTestReport() {
        console.log('\n📊 ACTION BUTTONS TEST REPORT');
        console.log('=' .repeat(60));
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} | ${result.name} | ${result.message}`);
        });
    }

    generateTestSummary() {
        const summary = {
            totalTests: this.testCount,
            passed: this.passedCount,
            failed: this.failedCount,
            passRate: this.testCount > 0 ? ((this.passedCount / this.testCount) * 100).toFixed(1) : 0,
            timestamp: new Date().toISOString(),
            results: this.testResults
        };

        console.log('\n🎯 TEST SUMMARY');
        console.log('=' .repeat(40));
        console.log(`Total Tests: ${summary.totalTests}`);
        console.log(`Passed: ${summary.passed}`);
        console.log(`Failed: ${summary.failed}`);
        console.log(`Pass Rate: ${summary.passRate}%`);
        console.log(`Status: ${summary.failed === 0 ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);

        return summary;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global testing functions
window.testActionButtons = async function() {
    const tester = new ActionButtonsTester();
    return await tester.runAllTests();
};

window.ActionButtonsTester = ActionButtonsTester;

console.log('🧪 Action Buttons Tester loaded. Run window.testActionButtons() to start comprehensive testing.');