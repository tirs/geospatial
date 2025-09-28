/**
 * Referral Management System
 * Handles all referral-related functionality for the dashboard
 */

class ReferralManager {
    constructor() {
        this.referrals = [];
        this.filteredReferrals = [];
        this.availableStatuses = [];
        this.currentFilters = {
            status: '',
            dateFilter: 'all'
        };
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStatusOptions();
        this.loadReferrals();
    }

    async loadStatusOptions() {
        try {
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/statuses` : '/api/Referral/statuses';
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.availableStatuses = data.statuses;
                    this.populateStatusFilter();
                }
            }
        } catch (error) {
            console.warn('Failed to load status options, using defaults:', error);
            // Fallback to default statuses
            this.availableStatuses = [
                { value: "Pending", label: "Pending" },
                { value: "Contacted", label: "Contacted" },
                { value: "Completed", label: "Completed" },
                { value: "Cancelled", label: "Cancelled" }
            ];
            this.populateStatusFilter();
        }
    }

    populateStatusFilter() {
        const statusFilter = document.getElementById('statusFilter');
        if (!statusFilter) return;

        // Clear existing options except "All Status"
        statusFilter.innerHTML = '<option value="">All Status</option>';

        // Add status options from API
        this.availableStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status.value;
            option.textContent = status.label;
            statusFilter.appendChild(option);
        });
    }

    bindEvents() {
        // Filter events
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.loadReferrals(); // Reload with new filters
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.currentFilters.dateFilter = e.target.value;
                this.loadReferrals(); // Reload with new filters
            });
        }
    }

    async loadReferrals() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Build query parameters for API filtering
            const params = new URLSearchParams();
            if (this.currentFilters.status) {
                params.append('status', this.currentFilters.status);
            }
            if (this.currentFilters.dateFilter && this.currentFilters.dateFilter !== 'all') {
                params.append('dateFilter', this.currentFilters.dateFilter);
            }

            // Use proper API base URL with fallback
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const baseApiUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/all` : '/api/Referral/all';
            const apiUrl = params.toString() ? `${baseApiUrl}?${params.toString()}` : baseApiUrl;
            
            console.log('Loading referrals from API:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                this.referrals = data.referrals;
                this.filteredReferrals = [...this.referrals]; // No more client-side filtering needed
                this.renderReferrals();
                this.updateReferralsBadge(this.referrals.length);
                this.updateDashboardStats();
            } else {
                throw new Error('Failed to load referrals');
            }
        } catch (error) {
            console.error('Error loading referrals:', error);
            this.showError('Failed to load referrals. Please try again.');
            this.loadFallbackData();
        } finally {
            this.isLoading = false;
        }
    }



    renderReferrals() {
        const tableBody = document.getElementById('referralsTableBody');
        if (!tableBody) return;
        
        if (this.filteredReferrals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-referrals">
                        <div class="empty-state">
                            <h3>No referrals found</h3>
                            <p>No referrals match your current filters.</p>
                            ${this.currentFilters.status || this.currentFilters.dateFilter !== 'all' ? 
                                '<button class="btn secondary" onclick="referralManager.clearFilters()">Clear Filters</button>' : 
                                '<button class="btn primary" onclick="quickActionsManager.handleQuickAction(\'create-referral\')">Create First Referral</button>'
                            }
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const rows = this.filteredReferrals.map(referral => {
            const mainContractor = referral.contractors && referral.contractors.length > 0 
                ? referral.contractors[0] 
                : null;
            
            const statusClass = this.getStatusClass(referral.status);
            const formattedDate = this.formatDate(referral.requestDate);
            
            return `
                <tr class="referral-row" data-referral-id="${referral.id}">
                    <td>
                        <span class="referral-id">#${referral.id}</span>
                    </td>
                    <td>
                        <div class="customer-info">
                            <strong>${referral.customerName || 'N/A'}</strong>
                            ${referral.customerPhone ? `<br><span class="phone">${referral.customerPhone}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <span class="service-type">${referral.serviceType || 'General'}</span>
                    </td>
                    <td>
                        <div class="contractor-info">
                            ${mainContractor ? 
                                `<strong>${mainContractor.companyName}</strong>
                                ${referral.contractors.length > 1 ? `<br><small>+${referral.contractors.length - 1} more</small>` : ''}` :
                                '<span class="text-muted">No contractors assigned</span>'
                            }
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${referral.status}</span>
                    </td>
                    <td>
                        <span class="date">${formattedDate}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" onclick="referralManager.viewReferral(${referral.id})" title="View Details">
                                <span class="icon">View</span>
                            </button>
                            <button class="btn-icon" onclick="referralManager.editReferral(${referral.id})" title="Edit">
                                <span class="icon">Edit</span>
                            </button>
                            <button class="btn-icon btn-danger" onclick="referralManager.deleteReferral(${referral.id})" title="Delete">
                                <span class="icon">Del</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = rows;
    }

    async viewReferral(referralId) {
        // Show loading state
        const viewButtons = document.querySelectorAll(`[onclick*="viewReferral(${referralId})"]`);
        viewButtons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Loading...';
        });
        
        try {
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/${referralId}` : `/api/Referral/${referralId}`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const referral = await response.json();
                this.showReferralDetailsModal(referral);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to load referral details`);
            }
        } catch (error) {
            console.error('Error loading referral details:', error);
            this.showNotification(`Failed to load referral details: ${error.message}`, 'error');
        } finally {
            // Restore button state
            viewButtons.forEach(btn => {
                btn.disabled = false;
                btn.innerHTML = '<span class="icon">View</span>';
            });
        }
    }

    async editReferral(referralId) {
        // Show loading state
        const editButtons = document.querySelectorAll(`[onclick*="editReferral(${referralId})"]`);
        editButtons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Loading...';
        });
        
        try {
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/${referralId}` : `/api/Referral/${referralId}`;
            const response = await fetch(apiUrl);
            
            if (response.ok) {
                const referral = await response.json();
                this.showEditReferralModal(referral);
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to load referral for editing`);
            }
        } catch (error) {
            console.error('Error loading referral for editing:', error);
            this.showNotification(`Failed to load referral for editing: ${error.message}`, 'error');
        } finally {
            // Restore button state
            editButtons.forEach(btn => {
                btn.disabled = false;
                btn.innerHTML = '<span class="icon">Edit</span>';
            });
        }
    }

    async deleteReferral(referralId) {
        const referral = this.referrals.find(r => r.id === referralId);
        const customerName = referral ? referral.customerName || 'Unknown Customer' : 'this referral';
        
        if (!confirm(`Are you sure you want to delete the referral for ${customerName}? This action cannot be undone.`)) {
            return;
        }
        
        // Show loading state for the specific button
        const deleteButtons = document.querySelectorAll(`[onclick*="deleteReferral(${referralId})"]`);
        deleteButtons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = 'Deleting...';
        });
        
        try {
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/${referralId}` : `/api/Referral/${referralId}`;
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                this.showNotification('Referral deleted successfully', 'success');
                this.loadReferrals(); // Reload to refresh the list
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete referral`);
            }
        } catch (error) {
            console.error('Error deleting referral:', error);
            this.showNotification(`Failed to delete referral: ${error.message}`, 'error');
            
            // Restore button state
            deleteButtons.forEach(btn => {
                btn.disabled = false;
                btn.innerHTML = '<span class="icon">Del</span>';
            });
        }
    }

    async refreshReferrals() {
        this.showNotification('Refreshing referrals...', 'info');
        await this.loadReferrals();
    }

    clearFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        
        if (statusFilter) statusFilter.value = '';
        if (dateFilter) dateFilter.value = 'all';
        
        this.currentFilters = {
            status: '',
            dateFilter: 'all'
        };
        
        this.loadReferrals(); // Reload with cleared filters
    }

    showReferralDetailsModal(referral) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content referral-details-modal">
                <div class="modal-header">
                    <h2>Referral Details #${referral.id}</h2>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="referral-info-grid">
                        <div class="info-section">
                            <h3>Customer Information</h3>
                            <div class="info-item">
                                <label>Name:</label>
                                <span>${referral.customerName || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Phone:</label>
                                <span>${referral.customerPhone || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>ZIP Code:</label>
                                <span>${referral.customerZipCode}</span>
                            </div>
                        </div>
                        
                        <div class="info-section">
                            <h3>Service Details</h3>
                            <div class="info-item">
                                <label>Service Type:</label>
                                <span>${referral.serviceType || 'General'}</span>
                            </div>
                            <div class="info-item">
                                <label>Status:</label>
                                <span class="status-badge ${this.getStatusClass(referral.status)}">${referral.status}</span>
                            </div>
                            <div class="info-item">
                                <label>Request Date:</label>
                                <span>${this.formatDateTime(referral.requestDate)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${referral.notes ? `
                        <div class="info-section">
                            <h3>Notes</h3>
                            <p class="referral-notes">${referral.notes}</p>
                        </div>
                    ` : ''}
                    
                    ${referral.details && referral.details.length > 0 ? `
                        <div class="info-section">
                            <h3>Assigned Contractors</h3>
                            <div class="contractors-list">
                                ${referral.details.map(detail => `
                                    <div class="contractor-detail">
                                        <div class="contractor-header">
                                            <h4>${detail.companyName}</h4>
                                            <span class="position-badge">Position #${detail.position}</span>
                                        </div>
                                        <div class="contractor-info">
                                            <p><strong>Contact:</strong> ${detail.contactName}</p>
                                            <p><strong>Phone:</strong> ${detail.phone}</p>
                                            ${detail.email ? `<p><strong>Email:</strong> ${detail.email}</p>` : ''}
                                            <p><strong>Distance:</strong> ${detail.distance ? detail.distance.toFixed(1) + ' miles' : 'N/A'}</p>
                                            <p><strong>Status:</strong> <span class="status-badge ${this.getStatusClass(detail.status)}">${detail.status}</span></p>
                                        </div>
                                        ${detail.estimateAmount ? `
                                            <div class="estimate-info">
                                                <p><strong>Estimate:</strong> $${detail.estimateAmount.toLocaleString()}</p>
                                                ${detail.estimateNotes ? `<p><strong>Notes:</strong> ${detail.estimateNotes}</p>` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    <button class="btn primary" onclick="referralManager.editReferral(${referral.id}); this.closest('.modal-overlay').remove();">Edit Referral</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showEditReferralModal(referral) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content edit-referral-modal">
                <div class="modal-header">
                    <h2>Edit Referral #${referral.id}</h2>
                    <button class="close-btn" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <form id="editReferralForm" onsubmit="referralManager.saveReferralChanges(event, ${referral.id})">
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="editCustomerName">Customer Name:</label>
                            <input type="text" id="editCustomerName" value="${referral.customerName || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editCustomerPhone">Customer Phone:</label>
                            <input type="tel" id="editCustomerPhone" value="${referral.customerPhone || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="editServiceType">Service Type:</label>
                            <select id="editServiceType" required>
                                <option value="">Select Service Type</option>
                                <option value="Plumbing" ${referral.serviceType === 'Plumbing' ? 'selected' : ''}>Plumbing</option>
                                <option value="Electrical" ${referral.serviceType === 'Electrical' ? 'selected' : ''}>Electrical</option>
                                <option value="HVAC" ${referral.serviceType === 'HVAC' ? 'selected' : ''}>HVAC</option>
                                <option value="Roofing" ${referral.serviceType === 'Roofing' ? 'selected' : ''}>Roofing</option>
                                <option value="Flooring" ${referral.serviceType === 'Flooring' ? 'selected' : ''}>Flooring</option>
                                <option value="Painting" ${referral.serviceType === 'Painting' ? 'selected' : ''}>Painting</option>
                                <option value="Landscaping" ${referral.serviceType === 'Landscaping' ? 'selected' : ''}>Landscaping</option>
                                <option value="General Contracting" ${referral.serviceType === 'General Contracting' ? 'selected' : ''}>General Contracting</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="editStatus">Status:</label>
                            <select id="editStatus" required>
                                <option value="Pending" ${referral.status === 'Pending' ? 'selected' : ''}>Pending</option>
                                <option value="Contacted" ${referral.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                                <option value="Completed" ${referral.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                <option value="Cancelled" ${referral.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="editNotes">Notes:</label>
                            <textarea id="editNotes" rows="4">${referral.notes || ''}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                        <button type="submit" class="btn primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async saveReferralChanges(event, referralId) {
        event.preventDefault();
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
        
        const formData = {
            customerName: document.getElementById('editCustomerName').value.trim(),
            customerPhone: document.getElementById('editCustomerPhone').value.trim(),
            serviceType: document.getElementById('editServiceType').value,
            status: document.getElementById('editStatus').value,
            notes: document.getElementById('editNotes').value.trim()
        };
        
        // Client-side validation
        if (!formData.customerName || !formData.customerPhone || !formData.serviceType || !formData.status) {
            this.showNotification('Please fill in all required fields', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        
        try {
            const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
            const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/${referralId}` : `/api/Referral/${referralId}`;
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                this.showNotification('Referral updated successfully', 'success');
                document.querySelector('.modal-overlay').remove();
                this.loadReferrals(); // Refresh the list
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to update referral`);
            }
        } catch (error) {
            console.error('Error updating referral:', error);
            this.showNotification(`Failed to update referral: ${error.message}`, 'error');
            
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    showLoadingState() {
        const tableBody = document.getElementById('referralsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="referrals-loading-cell">
                        <div class="loading-spinner"></div>
                        <h3>Loading referrals...</h3>
                    </td>
                </tr>
            `;
        }
    }

    loadFallbackData() {
        console.log('Loading fallback referral data...');
        this.referrals = [
            {
                id: 1,
                customerName: 'John Smith',
                customerPhone: '(555) 123-4567',
                serviceType: 'Plumbing',
                status: 'Pending',
                requestDate: new Date().toISOString(),
                contractors: [
                    { companyName: 'Smith Plumbing Co.', contactName: 'Mike Smith' }
                ]
            },
            {
                id: 2,
                customerName: 'Jane Doe',
                customerPhone: '(555) 987-6543',
                serviceType: 'Electrical',
                status: 'Completed',
                requestDate: new Date(Date.now() - 86400000).toISOString(),
                contractors: [
                    { companyName: 'Electric Solutions', contactName: 'Bob Johnson' }
                ]
            },
            {
                id: 3,
                customerName: 'Mike Johnson',
                customerPhone: '(555) 555-1234',
                serviceType: 'HVAC',
                status: 'Contacted',
                requestDate: new Date(Date.now() - 172800000).toISOString(),
                contractors: [
                    { companyName: 'Cool Air HVAC', contactName: 'Sarah Wilson' }
                ]
            },
            {
                id: 4,
                customerName: 'Lisa Brown',
                customerPhone: '(555) 777-8888',
                serviceType: 'Roofing',
                status: 'Pending',
                requestDate: new Date(Date.now() - 259200000).toISOString(),
                contractors: [
                    { companyName: 'Top Roof Solutions', contactName: 'David Lee' }
                ]
            },
            {
                id: 5,
                customerName: 'Tom Wilson',
                customerPhone: '(555) 999-0000',
                serviceType: 'General Contracting',
                status: 'Completed',
                requestDate: new Date(Date.now() - 345600000).toISOString(),
                contractors: [
                    { companyName: 'Wilson Construction', contactName: 'Tom Wilson Jr' }
                ]
            }
        ];
        this.filteredReferrals = [...this.referrals];
        this.renderReferrals();
        this.updateDashboardStats();
        this.showNotification('Demo data loaded - API connection failed, using sample data', 'warning');
    }

    showError(message) {
        const tableBody = document.getElementById('referralsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="error-state">
                        <div class="error-message">
                            <h3>Error Loading Referrals</h3>
                            <p>${message}</p>
                            <button class="btn primary" onclick="referralManager.loadReferrals()">Try Again</button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    updateReferralsBadge(count) {
        const badge = document.getElementById('referralsBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    updateDashboardStats() {
        const totalReferrals = this.referrals.length;
        const pendingReferrals = this.referrals.filter(r => r.status === 'Pending').length;
        const completedReferrals = this.referrals.filter(r => r.status === 'Completed').length;
        
        // Update dashboard stats cards
        const totalReferralsCard = document.querySelector('[data-stat="total-referrals"]');
        const pendingReferralsCard = document.querySelector('[data-stat="pending-referrals"]');
        const completedReferralsCard = document.querySelector('[data-stat="completed-referrals"]');
        
        if (totalReferralsCard) {
            totalReferralsCard.textContent = totalReferrals;
        }
        
        if (pendingReferralsCard) {
            pendingReferralsCard.textContent = pendingReferrals;
        }
        
        if (completedReferralsCard) {
            completedReferralsCard.textContent = completedReferrals;
        }
        
        console.log(`Dashboard stats updated: Total: ${totalReferrals}, Pending: ${pendingReferrals}, Completed: ${completedReferrals}`);
    }

    getStatusClass(status) {
        const statusClasses = {
            'Pending': 'status-pending',
            'Contacted': 'status-contacted', 
            'Completed': 'status-completed',
            'Cancelled': 'status-cancelled'
        };
        return statusClasses[status] || 'status-default';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    showNotification(message, type = 'info') {
        if (window.dashboard && window.dashboard.showNotification) {
            window.dashboard.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Debug function to test API URL construction
    debugAPIURL() {
        const apiBaseUrl = window.API_BASE_URL || window.CONFIG?.API_BASE_URL || '';
        const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/Referral/all` : '/api/Referral/all';
        
        console.log('=== API URL Debug Info ===');
        console.log('window.API_BASE_URL:', window.API_BASE_URL);
        console.log('window.CONFIG?.API_BASE_URL:', window.CONFIG?.API_BASE_URL);
        console.log('Resolved apiBaseUrl:', apiBaseUrl);
        console.log('Final API URL:', apiUrl);
        console.log('Current location:', window.location.href);
        
        return apiUrl;
    }
}

// Initialize referral manager when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.referralManager === 'undefined') {
        window.referralManager = new ReferralManager();
    }
});

// Global function for refresh button
window.refreshReferrals = function() {
    if (window.referralManager) {
        window.referralManager.refreshReferrals();
    }
};

// Global debug function
window.debugReferralAPI = function() {
    if (window.referralManager) {
        return window.referralManager.debugAPIURL();
    } else {
        console.log('ReferralManager not available');
        return null;
    }
};