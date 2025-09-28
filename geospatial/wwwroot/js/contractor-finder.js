// Urban Referral Network - Contractor Finder JavaScript
console.log('🚀 ContractorFinder JavaScript loaded - Version 2.0');
class ContractorFinder {
    constructor() {
        this.apiBase = window.API_BASE_URL || '';
        this.selectedContractors = [];
        this.currentSearchData = null;
        this.isDashboard = document.getElementById('dashboard-section') !== null;
        this.isLoading = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupValidation();
        this.setupQuickActionsIntegration();
    }

    setupQuickActionsIntegration() {
        // Integration with Quick Actions Manager
        if (window.quickActionsManager) {
            console.log('🔗 ContractorFinder integrated with QuickActionsManager');
        }
    }

    // Reset contractor selection state
    resetSelection() {
        this.selectedContractors = [];
        
        // Clear visual selection from all contractor cards
        document.querySelectorAll('.contractor-card').forEach(card => {
            card.classList.remove('selected');
            const button = card.querySelector('.select-btn');
            if (button) {
                button.textContent = 'Select';
                button.classList.remove('selected');
            }
        });
        
        // Hide referral form
        this.hideReferralForm();
        
        // Clear selected contractors display
        this.updateSelectedContractors();
        
        console.log('🔄 Contractor selection reset');
    }

    // Reset entire search state
    resetSearch() {
        this.resetSelection();
        this.currentSearchData = null;
        
        // Clear search form
        const form = document.getElementById('contractorSearchForm');
        if (form) {
            form.reset();
            // Set default values
            document.getElementById('maxDistance').value = '25';
        }
        
        // Clear results
        const resultsGrid = document.getElementById('contractorsGrid');
        if (resultsGrid) {
            resultsGrid.innerHTML = '';
        }
        
        const resultsInfo = document.getElementById('resultsInfo');
        if (resultsInfo) {
            resultsInfo.textContent = '';
        }
        
        // Hide New Search button
        const newSearchBtn = document.getElementById('newSearchBtn');
        if (newSearchBtn) {
            newSearchBtn.style.display = 'none';
        }
        
        console.log('🔄 Search state reset');
    }

    // Update selected contractors display
    updateSelectedContractors() {
        const selectedContractorsDiv = document.getElementById('selectedContractors');
        if (!selectedContractorsDiv) return;

        if (this.selectedContractors.length === 0) {
            selectedContractorsDiv.innerHTML = `
                <h3>Selected Contractors</h3>
                <p class="empty-state">No contractors selected yet.</p>
            `;
        } else {
            const contractorCards = this.selectedContractors.map(id => {
                const card = document.querySelector(`[data-contractor-id="${id}"]`);
                if (!card) return '';
                
                const name = card.querySelector('.contractor-name')?.textContent || 'Unknown';
                const phoneElement = card.querySelector('.contractor-details p');
                const phone = phoneElement ? phoneElement.textContent.replace('📞 ', '') : 'No phone';
                
                return `
                    <div class="selected-contractor">
                        <div>
                            <strong>${name}</strong><br>
                            <small style="color: var(--gray-600);">${phone}</small>
                        </div>
                        <button type="button" onclick="contractorFinder.toggleContractor(${id})" class="btn-remove">Remove</button>
                    </div>
                `;
            }).filter(card => card !== '').join('');

            selectedContractorsDiv.innerHTML = `
                <h3>Selected Contractors (${this.selectedContractors.length}/3)</h3>
                ${contractorCards}
            `;
        }
    }

    bindEvents() {
        // Search form
        document.getElementById('contractorSearchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchContractors();
        });

        // ZIP code validation
        document.getElementById('zipCode').addEventListener('blur', () => {
            this.validateZipCode();
        });

        // New Search button
        const newSearchBtn = document.getElementById('newSearchBtn');
        if (newSearchBtn) {
            newSearchBtn.addEventListener('click', () => {
                this.resetSearch();
            });
        }

        // Referral form
        document.getElementById('referralForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createReferral();
        });

        // Cancel referral
        document.getElementById('cancelReferral').addEventListener('click', () => {
            this.hideReferralForm();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('newSearch').addEventListener('click', () => {
            this.resetForm();
            this.hideModal();
        });
    }

    setupValidation() {
        const zipInput = document.getElementById('zipCode');
        zipInput.addEventListener('input', (e) => {
            // Allow only digits and dash
            e.target.value = e.target.value.replace(/[^\d-]/g, '');
            
            // Limit length
            if (e.target.value.length > 10) {
                e.target.value = e.target.value.substring(0, 10);
            }
        });
    }

    async validateZipCode() {
        const zipCodeElement = document.getElementById('zipCode');
        const validation = document.getElementById('zipValidation');
        
        if (!zipCodeElement || !validation) return;
        
        const zipCode = zipCodeElement.value.trim();
        
        if (!zipCode) {
            validation.textContent = '';
            validation.className = 'validation-message';
            return false;
        }

        if (!this.isValidZipFormat(zipCode)) {
            validation.textContent = 'Please enter a valid ZIP code format (12345 or 12345-6789)';
            validation.className = 'validation-message error';
            return false;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/Referral/validate-zipcode/${zipCode}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error('Invalid server response');
            }
            
            if (data.isValid) {
                validation.textContent = '✓ Valid Los Angeles area ZIP code';
                validation.className = 'validation-message success';
                return true;
            } else {
                validation.textContent = 'ZIP code not found in Los Angeles area';
                validation.className = 'validation-message error';
                return false;
            }
        } catch (error) {
            validation.textContent = 'Unable to validate ZIP code';
            validation.className = 'validation-message error';
            console.error('ZIP validation error:', error.message);
            return false;
        }
    }

    isValidZipFormat(zipCode) {
        const fiveDigit = /^\d{5}$/;
        const nineDight = /^\d{5}-\d{4}$/;
        return fiveDigit.test(zipCode) || nineDight.test(zipCode);
    }

    async searchContractors() {
        const form = document.getElementById('contractorSearchForm');
        const formData = new FormData(form);
        const searchBtn = document.getElementById('searchBtn');
        
        // Validate ZIP code first
        const isValidZip = await this.validateZipCode();
        if (!isValidZip) {
            return;
        }

        // Show loading state
        this.setButtonLoading(searchBtn, true);
        
        const searchData = {
            zipCode: formData.get('zipCode').trim(),
            serviceType: formData.get('serviceType') || null,
            maxDistance: parseInt(formData.get('maxDistance')) || 25,
            maxResults: 3
        };

        try {
            const response = await fetch(`${this.apiBase}/api/Referral/find-contractors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                throw new Error('Invalid response from server');
            }
            
            if (data.success) {
                this.currentSearchData = searchData;
                this.displayResults(data);
            } else {
                this.showError(data.error || 'Search failed');
            }
        } catch (error) {
            if (error.message.includes('JSON')) {
                this.showError('Server response error. Please try again.');
            } else {
                this.showError('Network error. Please try again.');
            }
            console.error('Search error:', error.message || error);
        } finally {
            this.setButtonLoading(searchBtn, false);
        }
    }

    displayResults(data) {
        const resultsPanel = document.getElementById('resultsPanel');
        const resultsInfo = document.getElementById('resultsInfo');
        const contractorsGrid = document.getElementById('contractorsGrid');

        // Update results info
        resultsInfo.textContent = `Found ${data.contractorsFound} contractor${data.contractorsFound !== 1 ? 's' : ''} within ${this.currentSearchData.maxDistance} miles of ${data.zipCode}`;

        // Show New Search button
        const newSearchBtn = document.getElementById('newSearchBtn');
        if (newSearchBtn) {
            newSearchBtn.style.display = 'inline-block';
        }

        // Clear previous results
        contractorsGrid.innerHTML = '';
        this.selectedContractors = [];

        if (data.contractors.length === 0) {
            contractorsGrid.innerHTML = `
                <div class="no-results">
                    <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                        <div style="font-size: 3rem; margin-bottom: 16px;">🔍</div>
                        <h3 style="margin-bottom: 8px; color: var(--gray-700);">No contractors found</h3>
                        <p>Try expanding your search radius or selecting a different service type.</p>
                    </div>
                </div>
            `;
        } else {
            data.contractors.forEach((contractor, index) => {
                const card = this.createContractorCard(contractor);
                card.style.animationDelay = `${index * 0.1}s`;
                contractorsGrid.appendChild(card);
            });
        }

        // Show results panel
        if (resultsPanel) {
            resultsPanel.style.display = 'block';
            resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // For standalone page compatibility
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.add('active');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    createContractorCard(contractor) {
        const card = document.createElement('div');
        card.className = 'contractor-card';
        card.dataset.contractorId = contractor.contractorId;

        const serviceTypes = this.formatServiceTypes(contractor.serviceTypes);

        const rating = contractor.rating > 0 ? 
            `<div class="contractor-rating">
                <span class="stars">${'★'.repeat(Math.floor(contractor.rating))}${'☆'.repeat(5 - Math.floor(contractor.rating))}</span>
                <span>${contractor.rating.toFixed(1)}</span>
            </div>` : 
            '<div class="contractor-rating">New Contractor</div>';

        card.innerHTML = `
            <div class="contractor-header">
                <div>
                    <div class="contractor-name">${contractor.companyName}</div>
                    <div class="contractor-contact">${contractor.contactName}</div>
                </div>
                <div class="contractor-distance">${contractor.distance.toFixed(1)} mi</div>
            </div>
            <div class="contractor-details">
                <p><strong>📞</strong> ${contractor.phone}</p>
                ${contractor.email ? `<p><strong>✉️</strong> ${contractor.email}</p>` : ''}
                ${contractor.address ? `<p><strong>📍</strong> ${contractor.address}, ${contractor.city}</p>` : ''}
                <p><strong>🔧</strong> ${serviceTypes}</p>
                ${rating}
            </div>
            <div class="contractor-actions">
                <button class="btn-select" onclick="contractorFinder.toggleContractor(${contractor.contractorId})">
                    Select for Referral
                </button>
            </div>
        `;

        return card;
    }

    toggleContractor(contractorId) {
        console.log('Toggling contractor:', contractorId);
        const card = document.querySelector(`[data-contractor-id="${contractorId}"]`);
        const button = card.querySelector('.btn-select');
        console.log('Found card:', card, 'Found button:', button);
        
        const index = this.selectedContractors.indexOf(contractorId);
        
        if (index === -1) {
            // Select contractor
            if (this.selectedContractors.length >= 3) {
                this.showError('You can select maximum 3 contractors for referral');
                return;
            }
            
            this.selectedContractors.push(contractorId);
            console.log('Added contractor to selection. Total selected:', this.selectedContractors);
            card.classList.add('selected');
            button.textContent = 'Selected ✓';
            button.classList.add('selected');
        } else {
            // Deselect contractor
            this.selectedContractors.splice(index, 1);
            card.classList.remove('selected');
            button.textContent = 'Select for Referral';
            button.classList.remove('selected');
        }

        // Show referral form if contractors selected
        if (this.selectedContractors.length > 0) {
            this.showReferralForm();
        } else {
            this.hideReferralForm();
        }
    }

    showReferralForm() {
        const referralSection = document.getElementById('referralSection');
        const referralPanel = document.getElementById('referralPanel');
        
        // Update selected contractors display
        this.updateSelectedContractors();

        // Show appropriate referral form (dashboard or standalone)
        if (referralPanel) {
            referralPanel.classList.add('active');
            referralPanel.scrollIntoView({ behavior: 'smooth' });
        } else if (referralSection) {
            referralSection.style.display = 'block';
            referralSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    hideReferralForm() {
        const referralSection = document.getElementById('referralSection');
        const referralPanel = document.getElementById('referralPanel');
        
        if (referralPanel) {
            referralPanel.classList.remove('active');
        }
        if (referralSection) {
            referralSection.style.display = 'none';
        }
        
        // Update selected contractors display
        this.updateSelectedContractors();
    }

    async createReferral() {
        const form = document.getElementById('referralForm');
        const formData = new FormData(form);
        const createBtn = document.getElementById('createReferralBtn');

        if (this.selectedContractors.length === 0) {
            this.showError('Please select at least one contractor');
            return;
        }

        if (!this.currentSearchData) {
            this.showError('Please search for contractors first');
            return;
        }

        this.setButtonLoading(createBtn, true);

        const referralData = {
            customerName: formData.get('customerName').trim(),
            customerPhone: formData.get('customerPhone').trim(),
            customerZipCode: this.currentSearchData.zipCode,
            serviceType: this.currentSearchData.serviceType,
            contractorIds: this.selectedContractors,
            createdBy: 'Call Center',
            // Enhanced tracking fields
            status: formData.get('status') || 'Referred',
            appointmentDate: formData.get('appointmentDate') || null,
            estimateAmount: formData.get('estimateAmount') ? parseFloat(formData.get('estimateAmount')) : null,
            estimateNotes: formData.get('estimateNotes')?.trim() || null,
            workStartDate: formData.get('workStartDate') || null,
            workCompletedDate: formData.get('workCompletedDate') || null,
            notes: formData.get('customerNotes')?.trim() || null
        };

        console.log('Sending referral data:', referralData);
        console.log('Current search data:', this.currentSearchData);
        console.log('Selected contractors:', this.selectedContractors);

        try {
            const response = await fetch(`${this.apiBase}/api/Referral/create-referral`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(referralData)
            });

            let data;
            try {
                data = await response.json();
                console.log('Server response:', data);
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                const responseText = await response.text();
                console.error('Raw response:', responseText);
                throw new Error('Invalid response from server');
            }
            
            if (!response.ok) {
                console.error('Server error:', data);
                throw new Error(data.error || `Server error: ${response.status}`);
            }
            
            if (data.success) {
                this.showSuccessModal(data.referralId, referralData);
            } else {
                this.showError(data.error || 'Failed to create referral');
            }
        } catch (error) {
            console.error('Referral creation error:', error);
            this.showError(error.message || 'Failed to create referral');
        } finally {
            this.setButtonLoading(createBtn, false);
        }
    }

    showSuccessModal(referralId, referralData) {
        const modal = document.getElementById('successModal');
        const details = document.getElementById('referralDetails');
        
        details.innerHTML = `
            <p><strong>Referral ID:</strong> #${referralId}</p>
            <p><strong>Customer:</strong> ${referralData.customerName}</p>
            <p><strong>Phone:</strong> ${referralData.customerPhone}</p>
            <p><strong>ZIP Code:</strong> ${referralData.customerZipCode}</p>
            <p><strong>Service:</strong> ${referralData.serviceType || 'General'}</p>
            <p><strong>Contractors:</strong> ${this.selectedContractors.length}</p>
        `;
        
        // Referral is now saved via API - no localStorage needed
        console.log('✅ Referral created via API:', referralId);
        
        modal.style.display = 'flex';
    }

    // Referrals are now saved via API - no localStorage needed
    saveReferralToStorage(referralId, referralData) {
        console.log('✅ Referral saved via API - no localStorage needed');
    }

    getSelectedContractorName() {
        // Get the first selected contractor's name
        if (this.selectedContractors.length > 0) {
            const selectedContractor = this.selectedContractors[0];
            const contractorCard = document.querySelector(`[data-contractor-id="${selectedContractor}"]`);
            const nameElement = contractorCard?.querySelector('.contractor-name');
            return nameElement?.textContent?.trim() || 'Unknown Contractor';
        }
        return this.selectedContractors.length > 1 ? 'Multiple Contractors' : 'Unknown Contractor';
    }

    getSelectedContractorPhone() {
        // Get the first selected contractor's phone
        if (this.selectedContractors.length > 0) {
            const selectedContractor = this.selectedContractors[0];
            const contractorCard = document.querySelector(`[data-contractor-id="${selectedContractor}"]`);
            
            // Find the paragraph with phone icon (📞)
            const phoneElements = contractorCard?.querySelectorAll('p');
            let phoneText = '';
            
            if (phoneElements) {
                for (let p of phoneElements) {
                    if (p.textContent.includes('📞')) {
                        phoneText = p.textContent.replace('📞', '').trim();
                        break;
                    }
                }
            }
            
            // Extract phone number from text
            const phoneMatch = phoneText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            return phoneMatch ? phoneMatch[0] : phoneText || 'N/A';
        }
        return 'N/A';
    }

    hideModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    resetForm() {
        // Reset forms
        const searchForm = document.getElementById('contractorSearchForm');
        const referralForm = document.getElementById('referralForm');
        if (searchForm) searchForm.reset();
        if (referralForm) referralForm.reset();
        
        // Hide sections (standalone page)
        const resultsSection = document.getElementById('resultsSection');
        const referralSection = document.getElementById('referralSection');
        if (resultsSection) resultsSection.style.display = 'none';
        if (referralSection) referralSection.style.display = 'none';
        
        // Hide referral panel (dashboard)
        const referralPanel = document.getElementById('referralPanel');
        if (referralPanel) referralPanel.classList.remove('active');
        
        // Reset validation
        const zipValidation = document.getElementById('zipValidation');
        if (zipValidation) {
            zipValidation.textContent = '';
            zipValidation.className = 'validation-message';
        }
        
        // Reset state
        this.selectedContractors = [];
        this.currentSearchData = null;
        
        // Clear results
        this.resetSearch();
    }

    setButtonLoading(button, loading) {
        const textSpan = button.querySelector('.btn-text');
        const loadingSpan = button.querySelector('.btn-loading');
        
        if (loading) {
            textSpan.style.display = 'none';
            loadingSpan.style.display = 'inline-flex';
            button.disabled = true;
        } else {
            textSpan.style.display = 'inline';
            loadingSpan.style.display = 'none';
            button.disabled = false;
        }
    }

    formatServiceTypes(serviceTypes) {
        if (!serviceTypes) return 'General Services';
        
        try {
            // Handle JSON array format
            if (serviceTypes.startsWith('[') && serviceTypes.endsWith(']')) {
                const parsed = JSON.parse(serviceTypes);
                return Array.isArray(parsed) ? parsed.join(', ') : serviceTypes;
            }
            // Handle comma-separated string
            return serviceTypes;
        } catch (error) {
            console.warn('Error parsing service types:', error.message);
            // Return the original string, cleaning up any malformed JSON characters
            return serviceTypes.replace(/[\[\]"]/g, '') || 'General Services';
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(`Error: ${message}`);
    }
}

// Initialize the application
const contractorFinder = new ContractorFinder();