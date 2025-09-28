/**
 * Urban Referral Network - Contractor Management Enhancement
 * Enhances contractor management functionality for the Quick Actions system
 */

class ContractorManager {
    constructor() {
        this.apiBaseUrl = window.API_BASE_URL || '';
        this.isLoading = false;
        this.contractors = [];
        this.pendingContractors = [];
    }

    // Initialize contractor management
    async initialize() {
        console.log('👷 Initializing Contractor Manager...');
        
        try {
            await this.loadAllContractors();
            await this.loadPendingContractors();
            this.setupEventListeners();
            console.log('✅ Contractor Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Contractor Manager:', error);
            this.showError('Failed to initialize contractor management');
        }
    }

    setupEventListeners() {
        // Add New Contractor button
        const addBtn = document.querySelector('button[onclick="addNewContractor()"]');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.preventDefault();
                this.showAddContractorForm();
            };
        }

        // Export button
        const exportBtn = document.querySelector('button[onclick="exportContractors()"]');
        if (exportBtn) {
            exportBtn.onclick = (e) => {
                e.preventDefault();
                this.exportContractors();
            };
        }

        // Search functionality
        const searchBtn = document.querySelector('button[onclick="searchContractors()"]');
        if (searchBtn) {
            searchBtn.onclick = (e) => {
                e.preventDefault();
                this.searchContractors();
            };
        }

        const clearBtn = document.querySelector('button[onclick="clearSearch()"]');
        if (clearBtn) {
            clearBtn.onclick = (e) => {
                e.preventDefault();
                this.clearSearch();
            };
        }

        // Search on enter
        const searchInput = document.getElementById('contractorSearch');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchContractors();
                }
            });
        }
    }

    // Load all active contractors
    async loadAllContractors() {
        try {
            this.isLoading = true;
            this.showLoadingState('Loading contractors...');

            const response = await fetch(`${this.apiBaseUrl}/api/Contractor`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.contractors = data.contractors || [];
            
            console.log(`👷 Loaded ${this.contractors.length} contractors`);
            this.displayContractors(this.contractors);

        } catch (error) {
            console.error('Failed to load contractors:', error);
            this.showError('Failed to load contractors from database');
            this.showEmptyState('Error loading contractors');
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }

    // Load pending contractors
    async loadPendingContractors() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/Contractor/pending`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.pendingContractors = data.contractors || [];
            
            console.log(`⏳ Loaded ${this.pendingContractors.length} pending contractors`);
            this.updatePendingBadge(this.pendingContractors.length);

        } catch (error) {
            console.error('Failed to load pending contractors:', error);
        }
    }

    // Display contractors in the grid
    displayContractors(contractors) {
        const grid = document.getElementById('contractorsManagementGrid');
        if (!grid) return;

        if (contractors.length === 0) {
            this.showEmptyState('No contractors found');
            return;
        }

        const contractorCards = contractors.map(contractor => this.createContractorCard(contractor)).join('');
        grid.innerHTML = contractorCards;
    }

    // Create contractor card HTML
    createContractorCard(contractor) {
        // Parse service types
        let services = [];
        try {
            if (contractor.serviceTypes) {
                const parsed = JSON.parse(contractor.serviceTypes);
                services = Array.isArray(parsed) ? parsed.flat() : [parsed];
            }
        } catch (e) {
            services = ['Various Services'];
        }

        // Generate avatar from company name
        const avatar = contractor.companyName.split(' ').map(n => n[0]).join('').substring(0, 2);
        
        // Format location
        const location = `${contractor.city}, ${contractor.state} ${contractor.zipCode}`;
        
        // Generate star rating
        const rating = contractor.rating || 0;
        const stars = '⭐'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

        // Format date
        const joinDate = new Date(contractor.createdDate).toLocaleDateString();

        return `
            <div class="contractor-card" data-contractor-id="${contractor.contractorId}">
                <div class="contractor-header">
                    <div class="contractor-avatar">${avatar}</div>
                    <div class="contractor-info">
                        <h4>${contractor.companyName}</h4>
                        <p>Contact: ${contractor.contactName}</p>
                        <div class="contractor-rating">
                            <span class="stars">${stars}</span>
                            <span class="rating-text">${rating.toFixed(1)} (New)</span>
                        </div>
                    </div>
                    <div class="contractor-status">
                        <span class="status-indicator ${contractor.isActive ? 'active' : 'inactive'}"></span>
                        <span>${contractor.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                </div>
                <div class="contractor-details">
                    <div class="detail-item">
                        <span class="label">📞 Phone:</span>
                        <span class="value">${contractor.phone}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">📧 Email:</span>
                        <span class="value">${contractor.email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">📍 Location:</span>
                        <span class="value">${location}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">🔧 Services:</span>
                        <span class="value">${services.slice(0, 2).join(', ')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">📅 Joined:</span>
                        <span class="value">${joinDate}</span>
                    </div>
                </div>
                <div class="contractor-actions">
                    <button class="btn-small primary" onclick="contractorManager.editContractor(${contractor.contractorId})">✏️ Edit</button>
                    <button class="btn-small secondary" onclick="contractorManager.viewContractorDetails(${contractor.contractorId})">👁️ View</button>
                    <button class="btn-small ${contractor.isActive ? 'warning' : 'success'}" 
                            onclick="contractorManager.toggleContractorStatus(${contractor.contractorId}, ${!contractor.isActive})">
                        ${contractor.isActive ? '⏸️ Suspend' : '▶️ Activate'}
                    </button>
                </div>
            </div>
        `;
    }

    // Toggle contractor active status
    async toggleContractorStatus(contractorId, newStatus) {
        try {
            const contractor = this.contractors.find(c => c.contractorId === contractorId);
            if (!contractor) {
                throw new Error('Contractor not found');
            }

            const action = newStatus ? 'activate' : 'suspend';
            const confirmMessage = `Are you sure you want to ${action} ${contractor.companyName}?`;
            
            if (!confirm(confirmMessage)) return;

            this.showNotification(`${action === 'activate' ? '▶️' : '⏸️'} ${action === 'activate' ? 'Activating' : 'Suspending'} contractor...`, 'info');

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
            
            if (data.success) {
                // Update local data
                contractor.isActive = data.isActive;
                
                // Refresh display
                this.displayContractors(this.contractors);
                
                this.showNotification(
                    `✅ ${contractor.companyName} ${data.isActive ? 'activated' : 'suspended'} successfully`,
                    'success'
                );
            } else {
                throw new Error(data.error || 'Status update failed');
            }

        } catch (error) {
            console.error('Toggle status failed:', error);
            this.showError(`Failed to update contractor status: ${error.message}`);
        }
    }

    // View contractor details
    async viewContractorDetails(contractorId) {
        try {
            const contractor = this.contractors.find(c => c.contractorId === contractorId);
            if (!contractor) {
                throw new Error('Contractor not found');
            }

            this.showContractorDetailsModal(contractor);

        } catch (error) {
            console.error('View details failed:', error);
            this.showError('Failed to load contractor details');
        }
    }

    // Edit contractor
    editContractor(contractorId) {
        try {
            const contractor = this.contractors.find(c => c.contractorId === contractorId);
            if (!contractor) {
                throw new Error('Contractor not found');
            }

            this.showEditContractorModal(contractor);

        } catch (error) {
            console.error('Edit contractor failed:', error);
            this.showError('Failed to open contractor editor');
        }
    }

    // Search contractors
    searchContractors() {
        const searchInput = document.getElementById('contractorSearch');
        const query = searchInput?.value?.toLowerCase().trim() || '';

        if (query === '') {
            this.displayContractors(this.contractors);
            return;
        }

        const filteredContractors = this.contractors.filter(contractor => {
            return (
                contractor.companyName?.toLowerCase().includes(query) ||
                contractor.contactName?.toLowerCase().includes(query) ||
                contractor.phone?.includes(query) ||
                contractor.email?.toLowerCase().includes(query) ||
                contractor.city?.toLowerCase().includes(query)
            );
        });

        this.displayContractors(filteredContractors);
        
        const resultsText = `Found ${filteredContractors.length} contractor(s) matching "${query}"`;
        this.showNotification(resultsText, 'info');
    }

    // Clear search
    clearSearch() {
        const searchInput = document.getElementById('contractorSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        this.displayContractors(this.contractors);
    }

    // Show add contractor form
    showAddContractorForm() {
        console.log('➕ Opening add contractor form...');
        this.showNotification('🚧 Add contractor functionality - coming soon!', 'info');
        
        // TODO: Implement add contractor form
        // For now, redirect to contractor registration page
        if (confirm('Would you like to open the contractor registration page?')) {
            window.open('/pages/contractor-registration-new.html', '_blank');
        }
    }

    // Export contractors to CSV
    exportContractors() {
        try {
            console.log('📊 Exporting contractors...');
            
            if (this.contractors.length === 0) {
                this.showError('No contractors to export');
                return;
            }

            const csvContent = this.generateContractorsCSV();
            const filename = `contractors-export-${new Date().toISOString().split('T')[0]}.csv`;
            
            this.downloadCSV(csvContent, filename);
            this.showNotification('📥 Contractors exported successfully!', 'success');

        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export contractors');
        }
    }

    // Generate CSV content for contractors
    generateContractorsCSV() {
        const headers = [
            'Company Name', 'Contact Name', 'Phone', 'Email', 'Address', 
            'City', 'State', 'ZIP Code', 'Service Types', 'Rating', 
            'Active Status', 'Created Date'
        ];

        const rows = this.contractors.map(contractor => [
            contractor.companyName,
            contractor.contactName,
            contractor.phone,
            contractor.email || '',
            contractor.address || '',
            contractor.city || '',
            contractor.state || '',
            contractor.zipCode || '',
            contractor.serviceTypes || '',
            contractor.rating || 0,
            contractor.isActive ? 'Active' : 'Inactive',
            new Date(contractor.createdDate).toLocaleDateString()
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    // Show contractor details modal
    showContractorDetailsModal(contractor) {
        // Use existing modal implementation from dashboard.js
        if (window.dashboard && window.dashboard.showContractorDetailsModal) {
            window.dashboard.showContractorDetailsModal(contractor);
        } else {
            // Fallback simple modal
            alert(`Contractor Details:\n\nCompany: ${contractor.companyName}\nContact: ${contractor.contactName}\nPhone: ${contractor.phone}\nEmail: ${contractor.email}`);
        }
    }

    // Show edit contractor modal
    showEditContractorModal(contractor) {
        console.log('✏️ Opening edit contractor modal...');
        this.showNotification('🚧 Edit contractor functionality - coming soon!', 'info');
        
        // TODO: Implement edit contractor modal
        // For now, show basic info
        alert(`Edit Contractor: ${contractor.companyName}\n\nThis feature will be implemented soon.`);
    }

    // Show loading state
    showLoadingState(message = 'Loading...') {
        const grid = document.getElementById('contractorsManagementGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Hide loading state
    hideLoadingState() {
        // Loading is automatically hidden when content is displayed
    }

    // Show empty state
    showEmptyState(message = 'No contractors found') {
        const grid = document.getElementById('contractorsManagementGrid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👷</div>
                    <h3>${message}</h3>
                    <p>Try adjusting your search criteria or add new contractors to the system.</p>
                    <button class="btn-primary" onclick="contractorManager.showAddContractorForm()">
                        ➕ Add New Contractor
                    </button>
                </div>
            `;
        }
    }

    // Update pending contractors badge
    updatePendingBadge(count) {
        const badge = document.getElementById('pendingContractorsBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    // Utility methods
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showNotification(message, type = 'info') {
        if (window.dashboard && window.dashboard.showNotification) {
            window.dashboard.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    showError(message) {
        this.showNotification(`❌ ${message}`, 'error');
    }

    // Refresh all contractor data
    async refresh() {
        console.log('🔄 Refreshing contractor data...');
        await this.loadAllContractors();
        await this.loadPendingContractors();
        this.showNotification('✅ Contractor data refreshed', 'success');
    }
}

// Create global instance
window.contractorManager = new ContractorManager();

// Export functions for backward compatibility
window.addNewContractor = () => window.contractorManager.showAddContractorForm();
window.exportContractors = () => window.contractorManager.exportContractors();
window.searchContractors = () => window.contractorManager.searchContractors();
window.clearSearch = () => window.contractorManager.clearSearch();

console.log('👷 Enhanced Contractor Manager loaded successfully!');