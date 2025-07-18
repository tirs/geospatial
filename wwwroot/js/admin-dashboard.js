// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.apiBase = '/api';
        this.currentSection = 'overview';
        this.serviceTypes = [
            'Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Flooring',
            'Painting', 'Landscaping', 'Handyman', 'Pool Service',
            'Pest Control', 'Cleaning', 'Moving', 'Security', 'Solar', 'Windows'
        ];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadOverviewData();
        this.setupServiceCheckboxes();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showSection(e.target.dataset.section);
            });
        });

        // Add contractor form
        document.getElementById('addContractorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addContractor();
        });

        // Filters
        document.getElementById('statusFilter')?.addEventListener('change', () => {
            this.loadReferrals();
        });

        document.getElementById('dateFilter')?.addEventListener('change', () => {
            this.loadReferrals();
        });
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'contractors':
                this.loadContractors();
                break;
            case 'referrals':
                this.loadReferrals();
                break;
            case 'coverage':
                this.loadCoverageData();
                break;
        }
    }

    async loadOverviewData() {
        try {
            // Simulate API calls - replace with actual endpoints
            const stats = await this.fetchStats();
            
            document.getElementById('totalContractors').textContent = stats.contractors || '0';
            document.getElementById('totalZipCodes').textContent = stats.zipCodes || '0';
            document.getElementById('totalReferrals').textContent = stats.referrals || '0';
            document.getElementById('monthlyReferrals').textContent = stats.monthlyReferrals || '0';
        } catch (error) {
            console.error('Error loading overview data:', error);
            this.showError('Failed to load overview data');
        }
    }

    async fetchStats() {
        // Mock data - replace with actual API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    contractors: 25,
                    zipCodes: 150,
                    referrals: 342,
                    monthlyReferrals: 28
                });
            }, 500);
        });
    }

    async loadContractors() {
        const tbody = document.getElementById('contractorsTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading contractors...</td></tr>';

        try {
            // Mock data - replace with actual API call
            const contractors = await this.fetchContractors();
            
            if (contractors.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="loading">No contractors found</td></tr>';
                return;
            }

            tbody.innerHTML = contractors.map(contractor => `
                <tr>
                    <td><strong>${contractor.companyName}</strong></td>
                    <td>${contractor.contactName}</td>
                    <td>${contractor.phone}</td>
                    <td>${contractor.zipCode}</td>
                    <td>${contractor.serviceTypes}</td>
                    <td>${contractor.rating > 0 ? contractor.rating.toFixed(1) + ' ★' : 'New'}</td>
                    <td><span class="status-badge status-${contractor.isActive ? 'active' : 'inactive'}">${contractor.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn-secondary" onclick="adminDashboard.editContractor(${contractor.id})">Edit</button>
                        <button class="btn-secondary" onclick="adminDashboard.toggleContractor(${contractor.id})">${contractor.isActive ? 'Deactivate' : 'Activate'}</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading contractors:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="loading">Error loading contractors</td></tr>';
        }
    }

    async fetchContractors() {
        // Mock data - replace with actual API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        companyName: 'LA Plumbing Pro',
                        contactName: 'John Smith',
                        phone: '(323) 555-0101',
                        zipCode: '90210',
                        serviceTypes: 'Plumbing, HVAC',
                        rating: 4.5,
                        isActive: true
                    },
                    {
                        id: 2,
                        companyName: 'Valley Electric',
                        contactName: 'Maria Garcia',
                        phone: '(818) 555-0102',
                        zipCode: '91401',
                        serviceTypes: 'Electrical, Solar',
                        rating: 4.8,
                        isActive: true
                    },
                    {
                        id: 3,
                        companyName: 'South Bay Roofing',
                        contactName: 'David Johnson',
                        phone: '(310) 555-0103',
                        zipCode: '90501',
                        serviceTypes: 'Roofing, Windows',
                        rating: 4.2,
                        isActive: true
                    }
                ]);
            }, 500);
        });
    }

    async loadReferrals() {
        const tbody = document.getElementById('referralsTableBody');
        tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading referrals...</td></tr>';

        try {
            const referrals = await this.fetchReferrals();
            
            if (referrals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="loading">No referrals found</td></tr>';
                return;
            }

            tbody.innerHTML = referrals.map(referral => `
                <tr>
                    <td>#${referral.id}</td>
                    <td>${referral.customerName}</td>
                    <td>${referral.customerPhone}</td>
                    <td>${referral.zipCode}</td>
                    <td>${referral.serviceType}</td>
                    <td>${new Date(referral.date).toLocaleDateString()}</td>
                    <td><span class="status-badge status-${referral.status.toLowerCase()}">${referral.status}</span></td>
                    <td>${referral.contractorCount}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading referrals:', error);
            tbody.innerHTML = '<tr><td colspan="8" class="loading">Error loading referrals</td></tr>';
        }
    }

    async fetchReferrals() {
        // Mock data - replace with actual API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1001,
                        customerName: 'Alice Johnson',
                        customerPhone: '(323) 555-1234',
                        zipCode: '90210',
                        serviceType: 'Plumbing',
                        date: '2024-01-15',
                        status: 'Completed',
                        contractorCount: 3
                    },
                    {
                        id: 1002,
                        customerName: 'Bob Smith',
                        customerPhone: '(818) 555-5678',
                        zipCode: '91401',
                        serviceType: 'Electrical',
                        date: '2024-01-14',
                        status: 'Pending',
                        contractorCount: 2
                    },
                    {
                        id: 1003,
                        customerName: 'Carol Davis',
                        customerPhone: '(310) 555-9012',
                        zipCode: '90501',
                        serviceType: 'HVAC',
                        date: '2024-01-13',
                        status: 'Completed',
                        contractorCount: 3
                    }
                ]);
            }, 500);
        });
    }

    async loadCoverageData() {
        const coverageList = document.getElementById('coverageList');
        coverageList.innerHTML = '<div class="loading">Loading coverage data...</div>';

        try {
            const coverage = await this.fetchCoverageData();
            
            coverageList.innerHTML = coverage.map(item => `
                <div class="coverage-item">
                    <h5>${item.zipCode} - ${item.city}</h5>
                    <p>${item.contractors} contractor${item.contractors !== 1 ? 's' : ''}</p>
                    <p>Avg distance: ${item.avgDistance} miles</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading coverage data:', error);
            coverageList.innerHTML = '<div class="loading">Error loading coverage data</div>';
        }
    }

    async fetchCoverageData() {
        // Mock data - replace with actual API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { zipCode: '90210', city: 'Beverly Hills', contractors: 5, avgDistance: 8.2 },
                    { zipCode: '90401', city: 'Santa Monica', contractors: 3, avgDistance: 12.5 },
                    { zipCode: '91401', city: 'Van Nuys', contractors: 4, avgDistance: 15.3 },
                    { zipCode: '90501', city: 'Torrance', contractors: 2, avgDistance: 18.7 }
                ]);
            }, 500);
        });
    }

    setupServiceCheckboxes() {
        const container = document.getElementById('serviceCheckboxes');
        container.innerHTML = this.serviceTypes.map(service => `
            <div class="service-checkbox">
                <input type="checkbox" id="service_${service}" name="serviceTypes" value="${service}">
                <label for="service_${service}">${service}</label>
            </div>
        `).join('');
    }

    showAddContractor() {
        document.getElementById('addContractorModal').style.display = 'flex';
    }

    hideModal() {
        document.getElementById('addContractorModal').style.display = 'none';
        document.getElementById('addContractorForm').reset();
    }

    async addContractor() {
        const form = document.getElementById('addContractorForm');
        const formData = new FormData(form);
        
        // Get selected service types
        const selectedServices = Array.from(document.querySelectorAll('input[name="serviceTypes"]:checked'))
            .map(cb => cb.value);

        const contractorData = {
            companyName: formData.get('companyName'),
            contactName: formData.get('contactName'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            zipCode: formData.get('zipCode'),
            serviceRadius: parseInt(formData.get('serviceRadius')),
            serviceTypes: JSON.stringify(selectedServices)
        };

        try {
            // Mock API call - replace with actual endpoint
            await this.submitContractor(contractorData);
            
            this.hideModal();
            this.showSuccess('Contractor added successfully!');
            
            if (this.currentSection === 'contractors') {
                this.loadContractors();
            }
            this.loadOverviewData(); // Refresh stats
        } catch (error) {
            console.error('Error adding contractor:', error);
            this.showError('Failed to add contractor');
        }
    }

    async submitContractor(data) {
        // Mock API call - replace with actual endpoint
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate for demo
                    resolve({ success: true, id: Date.now() });
                } else {
                    reject(new Error('Server error'));
                }
            }, 1000);
        });
    }

    async testZipCode() {
        const zipCode = prompt('Enter ZIP code to test:');
        if (!zipCode) return;

        try {
            const response = await fetch(`http://localhost:5003/api/referral/validate-zipcode/${zipCode}`);
            const data = await response.json();
            
            if (data.isValid) {
                this.showSuccess(`ZIP code ${zipCode} is valid and supported`);
            } else {
                this.showError(`ZIP code ${zipCode} is not supported in our coverage area`);
            }
        } catch (error) {
            this.showError('Error validating ZIP code');
        }
    }

    viewReports() {
        this.showSection('referrals');
    }

    refreshCoverage() {
        this.loadCoverageData();
    }

    editContractor(id) {
        // Implement contractor editing
        console.log('Edit contractor:', id);
        this.showInfo('Contractor editing feature coming soon');
    }

    toggleContractor(id) {
        // Implement contractor activation/deactivation
        console.log('Toggle contractor:', id);
        this.showInfo('Contractor status toggle feature coming soon');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Simple notification - could be enhanced with a proper notification system
        const className = type === 'success' ? 'alert-success' : 
                         type === 'error' ? 'alert-danger' : 'alert-info';
        
        const notification = document.createElement('div');
        notification.className = `alert ${className}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 2000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Initialize the admin dashboard
const adminDashboard = new AdminDashboard();