// Contractor Management JavaScript
// Contractor Management System - Production Version

// Force clear any cached styles
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .card-actions .btn {
            opacity: 1 !important;
            visibility: visible !important;
            display: inline-flex !important;
            background: #1a365d !important;
            color: white !important;
            border: none !important;
            padding: 8px 12px !important;
            margin: 2px !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            font-size: 12px !important;
            min-width: 70px !important;
            justify-content: center !important;
            align-items: center !important;
        }
        .card-actions .btn-warning { background: #d69e2e !important; }
        .card-actions .btn-success { background: #38a169 !important; }
        .card-actions .btn-danger { background: #e53e3e !important; }
        .card-actions .btn-secondary { background: #4b5563 !important; }
        .card-actions .btn:hover {
            opacity: 0.8 !important;
            transform: scale(1.05) !important;
        }
    `;
    document.head.appendChild(style);
});

class ContractorManager {
    constructor() {
        this.apiBase = (CONFIG?.API_BASE_URL || 'http://localhost:5000/api').replace('/referral', '');
        this.contractors = [];
        this.filteredContractors = [];
        this.viewMode = 'manage'; // 'manage' or 'view'
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadContractors();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchContractors');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterContractors(e.target.value));
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyFilters());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadContractors());
        }

        // View mode selector
        const viewModeSelect = document.getElementById('viewMode');
        if (viewModeSelect) {
            viewModeSelect.addEventListener('change', (e) => {
                this.viewMode = e.target.value;
                this.renderContractors();
            });
        }

        // Keyboard support for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async loadContractors() {
        const loadingDiv = document.getElementById('loadingState');
        const contractorsGrid = document.getElementById('contractorsGrid');
        
        try {
            if (loadingDiv) loadingDiv.style.display = 'block';
            if (contractorsGrid) contractorsGrid.style.display = 'none';

            const response = await fetch(`${this.apiBase}/contractor`);
            const data = await response.json();

            if (data.success) {
                this.contractors = data.contractors;
                this.filteredContractors = [...this.contractors];
                this.renderContractors();
                this.updateStats();
            } else {
                this.showError('Failed to load contractors');
            }
        } catch (error) {
            console.error('Error loading contractors:', error);
            this.showError('Network error loading contractors');
        } finally {
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (contractorsGrid) contractorsGrid.style.display = 'grid';
        }
    }

    filterContractors(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredContractors = this.contractors.filter(contractor => 
            contractor.companyName.toLowerCase().includes(term) ||
            contractor.contactName.toLowerCase().includes(term) ||
            contractor.phone.includes(term) ||
            (contractor.email && contractor.email.toLowerCase().includes(term))
        );
        this.applyFilters();
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter');
        let filtered = [...this.filteredContractors];

        if (statusFilter && statusFilter.value !== 'all') {
            const isActive = statusFilter.value === 'active';
            filtered = filtered.filter(contractor => contractor.isActive === isActive);
        }

        this.renderContractors(filtered);
        this.updateStats(filtered);
    }

    renderContractors(contractorsToRender = this.filteredContractors) {
        const grid = document.getElementById('contractorsGrid');
        if (!grid) return;

        if (contractorsToRender.length === 0) {
            grid.innerHTML = `
                <div class="no-contractors">
                    <div class="empty-state">
                        <div style="font-size: 3rem; margin-bottom: 16px;">👷</div>
                        <h3>No contractors found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                </div>
            `;
            return;
        }

        grid.innerHTML = contractorsToRender.map(contractor => this.createContractorCard(contractor)).join('');
        
        // Force button visibility after rendering
        setTimeout(() => {
            const buttons = document.querySelectorAll('.card-actions .btn');
            buttons.forEach(btn => {
                btn.style.opacity = '1';
                btn.style.visibility = 'visible';
                btn.style.display = 'inline-flex';
            });
            // Ensure button visibility
        }, 100);
    }

    createContractorCard(contractor) {
        const statusClass = contractor.isActive ? 'active' : 'suspended';
        const statusText = contractor.isActive ? 'Active' : 'Suspended';
        const actionText = contractor.isActive ? 'Suspend' : 'Activate';
        const actionIcon = contractor.isActive ? '⏸️' : '▶️';

        const serviceTypes = contractor.serviceTypes ? 
            JSON.parse(contractor.serviceTypes).slice(0, 3).join(', ') : 'No services listed';

        // Different card layouts based on view mode
        const actionsHtml = this.viewMode === 'manage' ? `
            <div class="card-actions">
                <button class="btn btn-primary action-btn" onclick="contractorManager.editContractor(${contractor.contractorId})" title="Edit contractor details">
                    ✏️ Edit
                </button>
                <button class="btn btn-${contractor.isActive ? 'warning' : 'success'} action-btn" 
                        onclick="contractorManager.toggleStatus(${contractor.contractorId})" 
                        title="${actionText} contractor">
                    ${actionIcon} ${actionText}
                </button>
                <button class="btn btn-danger action-btn" onclick="contractorManager.deleteContractor(${contractor.contractorId})" title="Delete contractor permanently">
                    🗑️ Delete
                </button>
            </div>
        ` : `
            <div class="card-actions">
                <button class="btn btn-primary action-btn" onclick="contractorManager.viewDetails(${contractor.contractorId})" title="View contractor details">
                    👁️ View Details
                </button>
                <button class="btn btn-secondary action-btn" onclick="contractorManager.contactContractor(${contractor.contractorId})" title="Contact contractor">
                    📞 Contact
                </button>
            </div>
        `;

        return `
            <div class="contractor-card ${statusClass}" data-contractor-id="${contractor.contractorId}">
                <div class="card-header">
                    <div class="contractor-info">
                        <h3 class="contractor-name">${contractor.companyName}</h3>
                        <p class="contact-name">${contractor.contactName}</p>
                    </div>
                    <div class="status-badge ${statusClass}">
                        ${statusText}
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="contact-info">
                        <p><strong>📞</strong> ${contractor.phone}</p>
                        ${contractor.email ? `<p><strong>✉️</strong> ${contractor.email}</p>` : ''}
                        ${contractor.address ? `<p><strong>📍</strong> ${contractor.address}, ${contractor.city}</p>` : ''}
                        <p><strong>📮</strong> ${contractor.zipCode}</p>
                    </div>
                    
                    <div class="service-info">
                        <p><strong>🔧 Services:</strong> ${serviceTypes}</p>
                        <p><strong>📏 Radius:</strong> ${contractor.serviceRadius} miles</p>
                        <p><strong>⭐ Rating:</strong> ${contractor.rating > 0 ? contractor.rating.toFixed(1) : 'New'}</p>
                    </div>
                </div>
                
                ${actionsHtml}
            </div>
        `;
    }

    async toggleStatus(contractorId) {
        const contractor = this.contractors.find(c => c.contractorId === contractorId);
        if (!contractor) return;

        const action = contractor.isActive ? 'suspend' : 'activate';
        const confirmed = confirm(`Are you sure you want to ${action} ${contractor.companyName}?`);
        
        if (!confirmed) return;

        try {
            const response = await fetch(`${this.apiBase}/contractor/${contractorId}/toggle-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                contractor.isActive = data.isActive;
                this.renderContractors();
                this.updateStats();
                this.showSuccess(data.message);
            } else {
                this.showError(data.error || 'Failed to update contractor status');
            }
        } catch (error) {
            console.error('Error toggling contractor status:', error);
            this.showError('Network error updating contractor status');
        }
    }

    async deleteContractor(contractorId) {
        const contractor = this.contractors.find(c => c.contractorId === contractorId);
        if (!contractor) return;

        const confirmed = confirm(`Are you sure you want to permanently delete ${contractor.companyName}? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            const response = await fetch(`${this.apiBase}/contractor/${contractorId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.contractors = this.contractors.filter(c => c.contractorId !== contractorId);
                this.filteredContractors = this.filteredContractors.filter(c => c.contractorId !== contractorId);
                this.renderContractors();
                this.updateStats();
                this.showSuccess(data.message);
            } else {
                this.showError(data.error || 'Failed to delete contractor');
            }
        } catch (error) {
            console.error('Error deleting contractor:', error);
            this.showError('Network error deleting contractor');
        }
    }

    editContractor(contractorId) {
        // Edit contractor functionality
        
        const contractor = this.contractors.find(c => c.contractorId === contractorId);
        if (!contractor) {
            console.error('❌ Contractor not found for ID:', contractorId);
            this.showError('Contractor not found!');
            return;
        }
        console.log('✅ Found contractor:', contractor.companyName);

        const modal = document.getElementById('contractorModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = `Edit ${contractor.companyName}`;

        const serviceTypes = contractor.serviceTypes ? JSON.parse(contractor.serviceTypes) : [];

        const editForm = `
            <form id="editContractorForm" class="edit-form">
                <div class="form-section">
                    <h3>📋 Company Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="companyName">Company Name</label>
                            <input type="text" id="companyName" value="${contractor.companyName}" required>
                        </div>
                        <div class="form-group">
                            <label for="contactName">Contact Person</label>
                            <input type="text" id="contactName" value="${contractor.contactName}" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>📞 Contact Information</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="phone">Phone</label>
                            <input type="tel" id="phone" value="${contractor.phone}" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" value="${contractor.email || ''}" placeholder="Optional">
                        </div>
                        <div class="form-group">
                            <label for="address">Address</label>
                            <input type="text" id="address" value="${contractor.address || ''}" placeholder="Optional">
                        </div>
                        <div class="form-group">
                            <label for="serviceRadius">Service Radius (miles)</label>
                            <input type="number" id="serviceRadius" value="${contractor.serviceRadius}" min="1" max="100" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h3>🔧 Service Information</h3>
                    <div class="form-group">
                        <label for="serviceTypes">Services (comma-separated)</label>
                        <textarea id="serviceTypes" rows="3" placeholder="e.g., Plumbing, Electrical, HVAC">${serviceTypes.join(', ')}</textarea>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="contractorManager.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">💾 Save Changes</button>
                </div>
            </form>
        `;

        modalBody.innerHTML = editForm;
        modal.classList.remove('hidden');

        // Handle form submission
        document.getElementById('editContractorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContractorChanges(contractorId);
        });
    }

    async saveContractorChanges(contractorId) {
        const form = document.getElementById('editContractorForm');
        const formData = new FormData(form);
        
        const serviceTypesText = document.getElementById('serviceTypes').value;
        const serviceTypesArray = serviceTypesText.split(',').map(s => s.trim()).filter(s => s);

        const updateData = {
            companyName: document.getElementById('companyName').value,
            contactName: document.getElementById('contactName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value || null,
            address: document.getElementById('address').value || null,
            serviceRadius: parseInt(document.getElementById('serviceRadius').value),
            serviceTypes: JSON.stringify(serviceTypesArray)
        };

        try {
            const response = await fetch(`${this.apiBase}/contractor/${contractorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (data.success) {
                this.showSuccess('Contractor updated successfully!');
                this.closeModal();
                this.loadContractors(); // Refresh the list
            } else {
                this.showError(data.error || 'Failed to update contractor');
            }
        } catch (error) {
            console.error('Error updating contractor:', error);
            this.showError('Network error updating contractor');
        }
    }

    viewDetails(contractorId) {
        console.log('👁️ View details called for contractor:', contractorId);
        
        const contractor = this.contractors.find(c => c.contractorId === contractorId);
        if (!contractor) {
            console.error('Contractor not found:', contractorId);
            this.showError('Contractor not found');
            return;
        }
        
        console.log('✅ Found contractor for details:', contractor);

        const modal = document.getElementById('contractorModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        if (!modal || !modalTitle || !modalBody) {
            console.error('Modal elements not found');
            this.showError('Unable to open details modal');
            return;
        }

        // Set modal title
        modalTitle.textContent = `${contractor.companyName} - Details`;

        // Parse services
        const serviceTypes = contractor.serviceTypes ? 
            JSON.parse(contractor.serviceTypes) : [];

        // Create simple detailed content first
        const detailsHtml = `
            <div style="padding: 20px;">
                <h3>📋 Company Information</h3>
                <p><strong>Company Name:</strong> ${contractor.companyName}</p>
                <p><strong>Contact Person:</strong> ${contractor.contactName}</p>
                <p><strong>Status:</strong> ${contractor.isActive ? '✅ Active' : '⏸️ Suspended'}</p>
                <p><strong>Member Since:</strong> ${new Date(contractor.createdDate).toLocaleDateString()}</p>
                
                <h3 style="margin-top: 20px;">📞 Contact Information</h3>
                <p><strong>Phone:</strong> ${contractor.phone}</p>
                ${contractor.email ? `<p><strong>Email:</strong> ${contractor.email}</p>` : ''}
                ${contractor.address ? `<p><strong>Address:</strong> ${contractor.address}</p>` : ''}
                ${contractor.city ? `<p><strong>City:</strong> ${contractor.city}</p>` : ''}
                <p><strong>ZIP Code:</strong> ${contractor.zipCode}</p>
                
                <h3 style="margin-top: 20px;">🔧 Service Information</h3>
                <p><strong>Service Radius:</strong> ${contractor.serviceRadius} miles</p>
                <p><strong>Rating:</strong> ${contractor.rating > 0 ? `⭐ ${contractor.rating.toFixed(1)}/5.0` : '🆕 New Contractor'}</p>
                ${serviceTypes.length > 0 ? `
                    <p><strong>Services:</strong> ${serviceTypes.join(', ')}</p>
                ` : '<p><strong>Services:</strong> No services listed</p>'}
            </div>
        `;

        console.log('📝 Setting modal content for:', contractor.companyName);
        console.log('📄 Modal body element:', modalBody);
        
        modalBody.innerHTML = detailsHtml;
        console.log('✅ Modal content set, showing modal');
        modal.classList.remove('hidden');
        
        // Double check the content was set
        setTimeout(() => {
            console.log('🔍 Modal body content after setting:', modalBody.innerHTML.substring(0, 100) + '...');
        }, 100);
    }

    closeModal() {
        const modal = document.getElementById('contractorModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    contactContractor(contractorId) {
        const contractor = this.contractors.find(c => c.contractorId === contractorId);
        if (!contractor) return;

        const actions = [
            `📞 Call: ${contractor.phone}`,
            contractor.email ? `✉️ Email: ${contractor.email}` : null
        ].filter(Boolean);

        alert(`Contact ${contractor.companyName}:\n\n${actions.join('\n')}`);
    }

    updateStats(contractorsToCount = this.contractors) {
        const totalElement = document.getElementById('totalContractors');
        const activeElement = document.getElementById('activeContractors');
        const suspendedElement = document.getElementById('suspendedContractors');
        const avgRatingElement = document.getElementById('avgRating');

        if (totalElement) totalElement.textContent = contractorsToCount.length;
        
        const activeCount = contractorsToCount.filter(c => c.isActive).length;
        if (activeElement) activeElement.textContent = activeCount;
        
        const suspendedCount = contractorsToCount.filter(c => !c.isActive).length;
        if (suspendedElement) suspendedElement.textContent = suspendedCount;

        const avgRating = contractorsToCount.length > 0 ? 
            contractorsToCount.reduce((sum, c) => sum + c.rating, 0) / contractorsToCount.length : 0;
        if (avgRatingElement) avgRatingElement.textContent = avgRating.toFixed(1);
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Debug function to check contractor data
    debugContractor(contractorId) {
        const contractor = this.contractors.find(c => c.contractorId === contractorId);
        console.log('Debug contractor:', contractor);
        console.log('All contractors:', this.contractors);
        console.log('View mode:', this.viewMode);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing ContractorManager...');
    try {
        window.contractorManager = new ContractorManager();
        console.log('✅ ContractorManager initialized successfully');
        
        // Add a test button to verify functionality
        setTimeout(() => {
            const testBtn = document.createElement('button');
            testBtn.textContent = '🧪 Test Edit Function';
            testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer;';
            testBtn.onclick = () => {
                console.log('Test button clicked');
                if (window.contractorManager && window.contractorManager.contractors.length > 0) {
                    const firstContractor = window.contractorManager.contractors[0];
                    console.log('Testing with first contractor:', firstContractor);
                    window.contractorManager.editContractor(firstContractor.contractorId);
                } else {
                    alert('No contractors loaded yet. Wait for data to load.');
                }
            };
            document.body.appendChild(testBtn);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error initializing ContractorManager:', error);
    }
});