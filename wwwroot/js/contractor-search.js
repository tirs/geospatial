/**
 * Contractor Search and Service Area Validation System
 * Integrates with ZIP autocomplete to find contractors and validate service areas
 */

class ContractorSearch {
    constructor() {
        this.cache = new Map();
        this.currentZip = null;
        this.init();
    }

    init() {
        // Listen for ZIP selection events
        document.addEventListener('zipSelected', (e) => {
            this.handleZipSelected(e.detail);
        });

        // Listen for manual ZIP changes
        document.addEventListener('change', (e) => {
            if (this.isZipInput(e.target)) {
                const zipCode = e.target.value.trim();
                if (zipCode.length === 5) {
                    this.handleZipChange(zipCode);
                }
            }
        });

        // Add CSS
        this.addCSS();
    }

    isZipInput(input) {
        if (!input || input.tagName !== 'INPUT') return false;
        
        const patterns = [/zip/i, /postal/i];
        return patterns.some(pattern => 
            pattern.test(input.name || '') ||
            pattern.test(input.id || '') ||
            pattern.test(input.placeholder || '') ||
            input.classList.contains('zip-autocomplete')
        );
    }

    async handleZipSelected(zipData) {
        this.currentZip = zipData.zipCode;
        await this.updateServiceInfo(zipData.zipCode);
    }

    async handleZipChange(zipCode) {
        if (zipCode === this.currentZip) return;
        this.currentZip = zipCode;
        await this.updateServiceInfo(zipCode);
    }

    async updateServiceInfo(zipCode) {
        try {
            // Get service coverage
            const coverage = await this.getServiceCoverage(zipCode);
            
            // Get available contractors
            const contractors = await this.getContractorsByZip(zipCode);
            
            // Update UI
            this.updateServiceCoverageDisplay(coverage);
            this.updateContractorDisplay(contractors);
            
            // Trigger custom event
            document.dispatchEvent(new CustomEvent('serviceInfoUpdated', {
                detail: { zipCode, coverage, contractors }
            }));
            
        } catch (error) {
            console.error('Error updating service info:', error);
            this.showError('Unable to load service information');
        }
    }

    async getServiceCoverage(zipCode) {
        const cacheKey = `coverage-${zipCode}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`/api/zipcode/${zipCode}/coverage`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const coverage = await response.json();
            this.cache.set(cacheKey, coverage);
            return coverage;
        } catch (error) {
            console.error('Coverage API error:', error);
            return this.getMockCoverage(zipCode);
        }
    }

    async getContractorsByZip(zipCode, serviceType = null) {
        const cacheKey = `contractors-${zipCode}-${serviceType || 'all'}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            let url = `/api/zipcode/${zipCode}/contractors`;
            if (serviceType) {
                url += `?serviceType=${encodeURIComponent(serviceType)}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const contractors = await response.json();
            this.cache.set(cacheKey, contractors);
            return contractors;
        } catch (error) {
            console.error('Contractors API error:', error);
            return this.getMockContractors(zipCode);
        }
    }

    updateServiceCoverageDisplay(coverage) {
        // Find or create service coverage widget
        let widget = document.getElementById('serviceCoverageWidget');
        if (!widget) {
            widget = this.createServiceCoverageWidget();
        }

        const statusColor = coverage.totalContractors > 0 ? '#10b981' : '#ef4444';
        const statusIcon = coverage.totalContractors > 0 ? '✅' : '❌';

        widget.innerHTML = `
            <div class="coverage-header">
                <h4>${statusIcon} Service Coverage</h4>
                <span class="zip-badge">${coverage.zipCode}</span>
            </div>
            <div class="coverage-stats">
                <div class="stat">
                    <span class="stat-number">${coverage.totalContractors}</span>
                    <span class="stat-label">Total Contractors</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${coverage.availableContractors}</span>
                    <span class="stat-label">Available Now</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${coverage.coveragePercentage}%</span>
                    <span class="stat-label">Coverage</span>
                </div>
            </div>
            <div class="service-types">
                ${coverage.serviceTypes.map(st => `
                    <div class="service-type ${st.contractorCount > 0 ? 'available' : 'unavailable'}">
                        <span class="service-name">${st.serviceType}</span>
                        <span class="contractor-count">${st.contractorCount}</span>
                    </div>
                `).join('')}
            </div>
        `;

        widget.style.display = 'block';
    }

    updateContractorDisplay(contractors) {
        // Find or create contractor list widget
        let widget = document.getElementById('contractorListWidget');
        if (!widget) {
            widget = this.createContractorListWidget();
        }

        if (contractors.length === 0) {
            widget.innerHTML = `
                <div class="no-contractors">
                    <h4>❌ No Contractors Available</h4>
                    <p>No contractors found for this ZIP code.</p>
                    <button class="expand-search-btn" onclick="contractorSearch.expandSearch()">
                        🔍 Search Nearby Areas
                    </button>
                </div>
            `;
        } else {
            widget.innerHTML = `
                <div class="contractor-header">
                    <h4>🔧 Available Contractors (${contractors.length})</h4>
                    <button class="refresh-btn" onclick="contractorSearch.refreshContractors()">🔄</button>
                </div>
                <div class="contractor-list">
                    ${contractors.map(c => `
                        <div class="contractor-card ${c.availability === 'Available' ? 'available' : 'busy'}">
                            <div class="contractor-info">
                                <div class="contractor-name">${c.businessName}</div>
                                <div class="contractor-contact">${c.contactName} • ${c.phone}</div>
                                <div class="contractor-services">${c.serviceTypes.join(', ')}</div>
                            </div>
                            <div class="contractor-stats">
                                <div class="rating">⭐ ${c.rating}/5</div>
                                <div class="response-time">${c.responseTime}</div>
                                <div class="availability ${c.availability.toLowerCase()}">${c.availability}</div>
                            </div>
                            <div class="contractor-actions">
                                <button class="assign-btn" onclick="contractorSearch.assignContractor(${c.contractorId})">
                                    Assign
                                </button>
                                <button class="contact-btn" onclick="contractorSearch.contactContractor('${c.phone}')">
                                    Call
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        widget.style.display = 'block';
    }

    createServiceCoverageWidget() {
        const widget = document.createElement('div');
        widget.id = 'serviceCoverageWidget';
        widget.className = 'service-coverage-widget';
        widget.style.display = 'none';

        // Try to insert after ZIP input or at end of form
        const zipInput = document.querySelector('input[name*="zip"], input[id*="zip"], .zip-autocomplete');
        if (zipInput) {
            const form = zipInput.closest('form') || zipInput.closest('.form-container');
            if (form) {
                form.appendChild(widget);
            } else {
                zipInput.parentNode.insertBefore(widget, zipInput.nextSibling);
            }
        } else {
            document.body.appendChild(widget);
        }

        return widget;
    }

    createContractorListWidget() {
        const widget = document.createElement('div');
        widget.id = 'contractorListWidget';
        widget.className = 'contractor-list-widget';
        widget.style.display = 'none';

        // Try to insert after service coverage widget or ZIP input
        const coverageWidget = document.getElementById('serviceCoverageWidget');
        if (coverageWidget) {
            coverageWidget.parentNode.insertBefore(widget, coverageWidget.nextSibling);
        } else {
            const zipInput = document.querySelector('input[name*="zip"], input[id*="zip"], .zip-autocomplete');
            if (zipInput) {
                const form = zipInput.closest('form') || zipInput.closest('.form-container');
                if (form) {
                    form.appendChild(widget);
                } else {
                    zipInput.parentNode.insertBefore(widget, zipInput.nextSibling);
                }
            } else {
                document.body.appendChild(widget);
            }
        }

        return widget;
    }

    async expandSearch() {
        if (!this.currentZip) return;

        try {
            const nearbyZips = await this.getNearbyZips(this.currentZip);
            const allContractors = [];

            for (const zip of nearbyZips.slice(0, 5)) { // Check top 5 nearby ZIPs
                const contractors = await this.getContractorsByZip(zip.zipCode);
                contractors.forEach(c => {
                    c.distance = zip.distance;
                    c.serviceZip = zip.zipCode;
                });
                allContractors.push(...contractors);
            }

            // Remove duplicates and sort by distance
            const uniqueContractors = allContractors.filter((contractor, index, self) =>
                index === self.findIndex(c => c.contractorId === contractor.contractorId)
            ).sort((a, b) => a.distance - b.distance);

            this.updateContractorDisplay(uniqueContractors);
        } catch (error) {
            console.error('Expand search error:', error);
            this.showError('Unable to expand search');
        }
    }

    async getNearbyZips(zipCode, radius = 10) {
        try {
            const response = await fetch(`/api/zipcode/${zipCode}/nearby?radiusMiles=${radius}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Nearby zips error:', error);
            return [];
        }
    }

    async refreshContractors() {
        if (!this.currentZip) return;
        
        // Clear cache for current ZIP
        const cacheKey = `contractors-${this.currentZip}-all`;
        this.cache.delete(cacheKey);
        
        // Reload contractors
        await this.updateServiceInfo(this.currentZip);
    }

    assignContractor(contractorId) {
        // Trigger custom event for assignment
        document.dispatchEvent(new CustomEvent('contractorAssigned', {
            detail: { contractorId, zipCode: this.currentZip }
        }));

        // Update UI to show assignment
        const contractorCard = document.querySelector(`[onclick*="${contractorId}"]`).closest('.contractor-card');
        if (contractorCard) {
            contractorCard.classList.add('assigned');
            contractorCard.querySelector('.assign-btn').textContent = 'Assigned ✓';
            contractorCard.querySelector('.assign-btn').disabled = true;
        }

        console.log('✅ Contractor assigned:', contractorId);
    }

    contactContractor(phone) {
        // Trigger custom event for contact
        document.dispatchEvent(new CustomEvent('contractorContacted', {
            detail: { phone, zipCode: this.currentZip }
        }));

        // Try to initiate call if telephony system is available
        if (window.telephonySystem) {
            window.telephonySystem.makeCall(phone);
        } else {
            // Fallback: copy to clipboard or show phone number
            navigator.clipboard.writeText(phone).then(() => {
                alert(`Phone number copied: ${phone}`);
            }).catch(() => {
                alert(`Call contractor: ${phone}`);
            });
        }

        console.log('📞 Contacting contractor:', phone);
    }

    showError(message) {
        // Create or update error display
        let errorDiv = document.getElementById('contractorSearchError');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'contractorSearchError';
            errorDiv.className = 'contractor-search-error';
            
            const zipInput = document.querySelector('input[name*="zip"], input[id*="zip"], .zip-autocomplete');
            if (zipInput) {
                zipInput.parentNode.insertBefore(errorDiv, zipInput.nextSibling);
            }
        }

        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.style.display='none'">×</button>
            </div>
        `;
        errorDiv.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    // Mock data for fallback
    getMockCoverage(zipCode) {
        return {
            zipCode,
            totalContractors: 5,
            availableContractors: 3,
            coveragePercentage: 60,
            serviceTypes: [
                { serviceType: 'Plumbing', contractorCount: 2, isAvailable: true },
                { serviceType: 'Electrical', contractorCount: 1, isAvailable: true },
                { serviceType: 'HVAC', contractorCount: 2, isAvailable: false }
            ],
            status: 'Covered'
        };
    }

    getMockContractors(zipCode) {
        return [
            {
                contractorId: 1,
                businessName: 'ABC Plumbing',
                contactName: 'John Smith',
                phone: '(555) 123-4567',
                email: 'john@abcplumbing.com',
                rating: 4.8,
                isVerified: true,
                serviceTypes: ['Plumbing', 'Emergency Repair'],
                responseTime: '< 2 hours',
                availability: 'Available'
            },
            {
                contractorId: 2,
                businessName: 'Elite Electric',
                contactName: 'Sarah Johnson',
                phone: '(555) 987-6543',
                email: 'sarah@eliteelectric.com',
                rating: 4.9,
                isVerified: true,
                serviceTypes: ['Electrical', 'Wiring'],
                responseTime: '< 1 hour',
                availability: 'Available'
            }
        ];
    }

    addCSS() {
        if (document.getElementById('contractor-search-styles')) return;

        const style = document.createElement('style');
        style.id = 'contractor-search-styles';
        style.textContent = `
            .service-coverage-widget, .contractor-list-widget {
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .coverage-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .coverage-header h4 {
                margin: 0;
                color: #1e293b;
                font-size: 1.1rem;
            }

            .zip-badge {
                background: #3b82f6;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 600;
            }

            .coverage-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }

            .stat {
                text-align: center;
                padding: 10px;
                background: #f8fafc;
                border-radius: 6px;
            }

            .stat-number {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                color: #1e293b;
            }

            .stat-label {
                font-size: 0.8rem;
                color: #64748b;
            }

            .service-types {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 8px;
            }

            .service-type {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.9rem;
            }

            .service-type.available {
                background: #dcfce7;
                color: #166534;
                border: 1px solid #bbf7d0;
            }

            .service-type.unavailable {
                background: #fef2f2;
                color: #991b1b;
                border: 1px solid #fecaca;
            }

            .contractor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .contractor-header h4 {
                margin: 0;
                color: #1e293b;
                font-size: 1.1rem;
            }

            .refresh-btn {
                background: #f1f5f9;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 0.9rem;
            }

            .refresh-btn:hover {
                background: #e2e8f0;
            }

            .contractor-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .contractor-card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 15px;
                transition: all 0.2s;
            }

            .contractor-card.available {
                border-left: 4px solid #10b981;
            }

            .contractor-card.busy {
                border-left: 4px solid #f59e0b;
            }

            .contractor-card.assigned {
                background: #f0fdf4;
                border-color: #bbf7d0;
            }

            .contractor-card:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .contractor-info {
                margin-bottom: 10px;
            }

            .contractor-name {
                font-weight: 600;
                color: #1e293b;
                font-size: 1rem;
            }

            .contractor-contact {
                color: #64748b;
                font-size: 0.9rem;
                margin: 2px 0;
            }

            .contractor-services {
                color: #3b82f6;
                font-size: 0.8rem;
                font-weight: 500;
            }

            .contractor-stats {
                display: flex;
                gap: 15px;
                margin-bottom: 10px;
                font-size: 0.8rem;
            }

            .rating {
                color: #f59e0b;
                font-weight: 600;
            }

            .response-time {
                color: #64748b;
            }

            .availability.available {
                color: #10b981;
                font-weight: 600;
            }

            .availability.busy {
                color: #f59e0b;
                font-weight: 600;
            }

            .contractor-actions {
                display: flex;
                gap: 8px;
            }

            .assign-btn, .contact-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .assign-btn {
                background: #3b82f6;
                color: white;
            }

            .assign-btn:hover {
                background: #2563eb;
            }

            .assign-btn:disabled {
                background: #10b981;
                cursor: not-allowed;
            }

            .contact-btn {
                background: #f1f5f9;
                color: #374151;
                border: 1px solid #e2e8f0;
            }

            .contact-btn:hover {
                background: #e2e8f0;
            }

            .no-contractors {
                text-align: center;
                padding: 30px;
                color: #64748b;
            }

            .no-contractors h4 {
                margin: 0 0 10px 0;
                color: #ef4444;
            }

            .expand-search-btn {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                margin-top: 15px;
            }

            .expand-search-btn:hover {
                background: #2563eb;
            }

            .contractor-search-error {
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 12px;
                margin: 10px 0;
                display: none;
            }

            .error-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .error-icon {
                color: #ef4444;
            }

            .error-message {
                color: #991b1b;
                flex: 1;
            }

            .error-close {
                background: none;
                border: none;
                color: #991b1b;
                cursor: pointer;
                font-size: 1.2rem;
                padding: 0;
                width: 20px;
                height: 20px;
            }

            @media (max-width: 768px) {
                .coverage-stats {
                    grid-template-columns: 1fr;
                }
                
                .contractor-stats {
                    flex-direction: column;
                    gap: 5px;
                }
                
                .contractor-actions {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the contractor search system
window.contractorSearch = new ContractorSearch();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContractorSearch;
}