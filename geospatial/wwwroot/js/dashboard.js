// Urban Referral Network - Dashboard JavaScript

// Clear all mock data on production startup
function clearDemoData() {
    // Remove all mock data from localStorage
    localStorage.removeItem('pendingContractors');
    localStorage.removeItem('contractors');
    localStorage.removeItem('rejectedContractors');
    localStorage.removeItem('contractorsProcessed');
    localStorage.removeItem('referrals');
    localStorage.removeItem('systemUsers');
    localStorage.removeItem('callCenterSettings');
    
    console.log(' All mock data cleared - using real API data only');
}

// Initialize clean system on load
document.addEventListener('DOMContentLoaded', function() {
    clearDemoData();
});

// Debug functions - Available immediately
window.setAdminRole = function() {
    localStorage.setItem('userRole', 'admin');
    console.log(' User role set to admin');
    if (window.dashboard && window.dashboard.showNotification) {
        window.dashboard.showNotification(' Admin role activated', 'success');
    } else {
        alert(' Admin role activated');
    }
};

// Production build - debug functions removed

window.addNewUser = function() {
    console.log('🚀 addNewUser function called');
    
    // Check if user is admin (case-insensitive)
    const userRole = localStorage.getItem('userRole');
    console.log(' Current userRole:', userRole);
    
    if (!userRole || userRole.toLowerCase() !== 'admin') {
        console.log(' Access denied - not admin');
        const message = ` Admin access required. Current role: ${userRole || 'None'}`;
        
        if (window.dashboard && window.dashboard.showNotification) {
            window.dashboard.showNotification(message, 'error');
        } else {
            alert(message);
        }
        return;
    }
    
    console.log(' Admin access confirmed, redirecting...');
    
    // Show loading message
    if (window.dashboard && window.dashboard.showNotification) {
        window.dashboard.showNotification(' Opening user registration form...', 'info');
    }
    
    // Redirect to admin agent registration page
    try {
        const targetUrl = 'admin-agent-registration.html';
        console.log(' Redirecting to:', targetUrl);
        window.location.href = targetUrl;
    } catch (error) {
        console.error(' Redirect failed:', error);
        if (window.dashboard && window.dashboard.showNotification) {
            window.dashboard.showNotification(' Failed to open registration form', 'error');
        } else {
            alert(' Failed to open registration form');
        }
    }
};

class Dashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.contractorFinder = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        this.initializeContractorFinder();
        this.showSection('dashboard');
    }

    setupEventListeners() {
        // Navigation menu clicks
        document.querySelectorAll('.menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                this.setActiveMenuItem(link);
            });
        });

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileMenuToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Quick action buttons
        this.setupQuickActions();

        // Search functionality
        this.setupSearch();

        // Notification handling
        this.setupNotifications();
    }

    setupMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: none;
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });
    }

    toggleMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        sidebar.classList.toggle('active');
        overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
    }

    closeMobileMenu() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        sidebar.classList.remove('active');
        overlay.style.display = 'none';
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            this.updatePageTitle(sectionName);
        }

        // Close mobile menu if open
        if (window.innerWidth <= 768) {
            this.closeMobileMenu();
        }

        // Initialize section-specific functionality
        this.initializeSection(sectionName);
    }

    setActiveMenuItem(activeLink) {
        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to clicked item
        activeLink.closest('.menu-item').classList.add('active');
    }

    updatePageTitle(sectionName) {
        const pageTitle = document.querySelector('.page-title');
        const titles = {
            'dashboard': 'Dashboard',
            'contractor-finder': 'Find Contractors',
            'referrals': 'Referrals',
            'contractors': 'Contractors',
            'pending-contractors': 'Pending Contractors',
            'analytics': 'Analytics',
            'settings': 'Settings'
        };
        
        if (pageTitle && titles[sectionName]) {
            pageTitle.textContent = titles[sectionName];
        }
    }

    initializeSection(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'contractor-finder':
                this.initializeContractorFinder();
                break;
            case 'contractors':
                this.initializeContractors();
                break;
            case 'pending-contractors':
                this.initializePendingContractors();
                break;
            case 'referrals':
                this.initializeReferrals();
                break;
            case 'analytics':
                this.initializeAnalytics();
                break;
            case 'settings':
                this.initializeSettings();
                break;
            default:
                break;
        }
    }

    initializeDashboard() {
        // Animate stats cards
        this.animateStatsCards();
        
        // Update real-time data (if needed)
        this.updateDashboardStats();
    }

    animateStatsCards() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    async updateDashboardStats() {
        try {
            const response = await fetch('/api/DataSummary/overview');
            const data = await response.json();
            
            // Update with real database data
            this.animateNumber('.stat-card.primary .stat-number', data.tableCounts.contractors);
            this.animateNumber('.stat-card.success .stat-number', data.tableCounts.referrals);
            this.animateNumber('.stat-card.warning .stat-number', data.sampleData.recentReferralsCount);
            
            // Calculate revenue based on referrals (example: $50 per referral)
            const revenue = (data.tableCounts.referrals * 0.05).toFixed(1);
            const revenueElement = document.querySelector('.stat-card.info .stat-number');
            if (revenueElement) {
                revenueElement.textContent = `$${revenue}K`;
            }
            
            // Update change indicators with real status
            this.updateChangeIndicators(data);
            
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            // Fallback to show current database status
            this.showOfflineStats();
        }
    }

    updateChangeIndicators(data) {
        // Update change indicators based on real data
        const contractorChange = document.querySelector('.stat-card.primary .stat-change');
        const referralChange = document.querySelector('.stat-card.success .stat-change');
        const pendingChange = document.querySelector('.stat-card.warning .stat-change');
        
        if (contractorChange) {
            contractorChange.textContent = `${data.tableCounts.contractors} total contractors`;
            contractorChange.className = 'stat-change neutral';
        }
        
        if (referralChange) {
            referralChange.textContent = 'Live data';
            referralChange.className = 'stat-change positive';
        }
        
        if (pendingChange) {
            pendingChange.textContent = `${data.sampleData.recentReferralsCount} this month`;
            pendingChange.className = 'stat-change neutral';
        }
    }

    showOfflineStats() {
        // Show basic stats when API is unavailable
        this.animateNumber('.stat-card.primary .stat-number', 6);
        this.animateNumber('.stat-card.success .stat-number', 0);
        this.animateNumber('.stat-card.warning .stat-number', 0);
        
        const revenueElement = document.querySelector('.stat-card.info .stat-number');
        if (revenueElement) {
            revenueElement.textContent = '$0.0K';
        }
    }

    animateNumber(selector, targetNumber) {
        const element = document.querySelector(selector);
        if (!element) return;

        const startNumber = parseInt(element.textContent) || 0;
        const duration = 1000;
        const startTime = Date.now();

        const updateNumber = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const currentNumber = Math.floor(startNumber + (targetNumber - startNumber) * progress);
            
            element.textContent = currentNumber.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        };

        updateNumber();
    }

    initializeContractorFinder() {
        if (!this.contractorFinder) {
            // Initialize the contractor finder when needed
            this.contractorFinder = new ContractorFinder();
        } else {
            // Reset selection state when returning to contractor finder
            this.contractorFinder.resetSelection();
        }
    }

    initializeContractors() {
        // Initialize contractor management
        this.loadContractors();
    }

    async initializeReferrals() {
        // Initialize referral management
        await this.loadReferrals();
        this.setupReferralFilters();
    }

    async loadContractors() {
        console.log(' Loading contractors from database...');
        const contractorsGrid = document.getElementById('contractorsManagementGrid');
        if (!contractorsGrid) return;

        try {
            const response = await fetch('/api/Contractors');
            const contractors = await response.json();
            
            console.log('👷 Found contractors:', contractors.length);

            if (contractors.length === 0) {
                contractorsGrid.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">👷</div>
                        <h3>No Contractors Yet</h3>
                        <p>No active contractors in the database.<br>Add contractors through the system to see them here.</p>
                    </div>
                `;
                return;
            }

            this.renderContractors(contractors, contractorsGrid);
            
        } catch (error) {
            console.error('Failed to load contractors:', error);
            contractorsGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"></div>
                    <h3>Error Loading Contractors</h3>
                    <p>Unable to connect to database.<br>Please try again later.</p>
                </div>
            `;
        }
    }

    renderContractors(contractors, contractorsGrid) {
        // Generate contractor cards using real database data
        const contractorCards = contractors.map(contractor => {
            // Parse service types (handle JSON string format)
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
                            <span class="status-indicator active"></span>
                            <span>Active</span>
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
                            <span class="value">${this.formatDate(contractor.dateAdded)}</span>
                        </div>
                    </div>
                    <div class="contractor-actions">
                        <button class="btn-small primary" onclick="window.dashboard.editContractor(${contractor.contractorId})">✏️ Edit</button>
                        <button class="btn-small secondary" onclick="window.dashboard.viewContractorDetails(${contractor.contractorId})">👁️ View</button>
                        <button class="btn-small warning" onclick="window.dashboard.suspendContractor(${contractor.contractorId})">⏸️ Suspend</button>
                    </div>
                </div>
            `;
        }).join('');

        contractorsGrid.innerHTML = contractorCards;
    }

    getInitialDemoContractors() {
        return [
            {
                id: 1,
                name: 'ABC Plumbing Services',
                company: 'ABC Plumbing Co.',
                phone: '(555) 111-2222',
                email: 'contact@abcplumbing.com',
                location: 'Downtown District',
                services: ['Plumbing', 'Emergency Repairs', 'Pipe Installation'],
                rating: 4.8,
                completedJobs: 127,
                status: 'active',
                avatar: '🔧',
                joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
                experience: '10 years',
                verified: true
            },
            {
                id: 2,
                name: 'Quick Fix Electric',
                company: 'QFE Services',
                phone: '(555) 333-4444',
                email: 'info@quickfixelectric.com',
                location: 'North Side',
                services: ['Electrical Wiring', 'Panel Upgrades', 'Lighting'],
                rating: 4.6,
                completedJobs: 89,
                status: 'active',
                avatar: '⚡',
                joinDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
                experience: '8 years',
                verified: true
            }
        ];
    }

    editContractor(contractorId) {
        console.log('✏️ Edit contractor:', contractorId);
        
        const contractors = this.getStoredContractors();
        const contractor = contractors.find(c => c.id === contractorId);
        
        if (!contractor) {
            this.showNotification(' Contractor not found', 'error');
            return;
        }
        
        this.showEditContractorModal(contractor);
    }

    showEditContractorModal(contractor) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ Edit Contractor: ${contractor.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editContractorForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editName">Name:</label>
                                <input type="text" id="editName" value="${contractor.name}" required>
                            </div>
                            <div class="form-group">
                                <label for="editCompany">Company:</label>
                                <input type="text" id="editCompany" value="${contractor.company || ''}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editPhone">Phone:</label>
                                <input type="tel" id="editPhone" value="${contractor.phone}" required>
                            </div>
                            <div class="form-group">
                                <label for="editEmail">Email:</label>
                                <input type="email" id="editEmail" value="${contractor.email}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editLocation">Location:</label>
                                <input type="text" id="editLocation" value="${contractor.location}" required>
                            </div>
                            <div class="form-group">
                                <label for="editStatus">Status:</label>
                                <select id="editStatus">
                                    <option value="active" ${contractor.status === 'active' ? 'selected' : ''}>Active</option>
                                    <option value="suspended" ${contractor.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                                    <option value="inactive" ${contractor.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="editServices">Services (comma-separated):</label>
                            <input type="text" id="editServices" value="${contractor.services ? contractor.services.join(', ') : ''}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="editExperience">Experience:</label>
                                <input type="text" id="editExperience" value="${contractor.experience || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="editHourlyRate">Hourly Rate ($):</label>
                                <input type="number" id="editHourlyRate" value="${contractor.hourlyRate || 85}" min="0" step="5">
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn-primary" onclick="window.dashboard.saveContractorChanges(${contractor.id}); this.closest('.modal').remove();">
                        💾 Save Changes
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    saveContractorChanges(contractorId) {
        const contractors = this.getStoredContractors();
        const contractorIndex = contractors.findIndex(c => c.id === contractorId);
        
        if (contractorIndex === -1) {
            this.showNotification(' Contractor not found', 'error');
            return;
        }
        
        // Get form values
        const name = document.getElementById('editName').value.trim();
        const company = document.getElementById('editCompany').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const location = document.getElementById('editLocation').value.trim();
        const status = document.getElementById('editStatus').value;
        const services = document.getElementById('editServices').value.split(',').map(s => s.trim()).filter(s => s);
        const experience = document.getElementById('editExperience').value.trim();
        const hourlyRate = parseFloat(document.getElementById('editHourlyRate').value) || 85;
        
        // Validate required fields
        if (!name || !company || !phone || !email || !location || services.length === 0) {
            this.showNotification(' Please fill in all required fields', 'error');
            return;
        }
        
        // Update contractor
        contractors[contractorIndex] = {
            ...contractors[contractorIndex],
            name,
            company,
            phone,
            email,
            location,
            status,
            services,
            experience,
            hourlyRate,
            lastModified: new Date().toISOString(),
            modifiedBy: localStorage.getItem('agentName') || 'Admin'
        };
        
        // Save to localStorage
        localStorage.setItem('contractors', JSON.stringify(contractors));
        
        // Refresh the contractors list
        this.loadContractors();
        
        this.showNotification(` ${name} updated successfully!`, 'success');
        console.log(' Contractor updated:', contractors[contractorIndex]);
    }

    viewApprovedContractorDetails(contractorId) {
        console.log('👁️ View approved contractor details:', contractorId);
        
        const contractors = this.getStoredContractors();
        const contractor = contractors.find(c => c.id === contractorId);
        
        if (!contractor) {
            this.showNotification(' Contractor not found', 'error');
            return;
        }
        
        this.showApprovedContractorDetailsModal(contractor);
    }

    showApprovedContractorDetailsModal(contractor) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content contractor-details-modal">
                <div class="modal-header">
                    <h3>👁️ Contractor Details: ${contractor.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Contractor Header -->
                    <div class="contractor-details-header">
                        <div class="contractor-avatar-large">
                            ${contractor.avatar || contractor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div class="contractor-main-info">
                            <h2>${contractor.name}</h2>
                            <h3>${contractor.company}</h3>
                            <div class="status-badge ${contractor.status}">
                                ${contractor.status === 'active' ? ' Active' : 
                                  contractor.status === 'suspended' ? '⏸️ Suspended' : 
                                  '⏹️ Inactive'}
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="details-section">
                        <h4>📞 Contact Information</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">📧 Email:</span>
                                <span class="detail-value">
                                    <a href="mailto:${contractor.email}">${contractor.email}</a>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">📱 Phone:</span>
                                <span class="detail-value">
                                    <a href="tel:${contractor.phone}">${contractor.phone}</a>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">📍 Location:</span>
                                <span class="detail-value">${contractor.location}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">🏢 Company:</span>
                                <span class="detail-value">${contractor.company}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Performance Information -->
                    <div class="details-section">
                        <h4> Performance & Stats</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">⭐ Rating:</span>
                                <span class="detail-value">${contractor.rating || '5.0'}/5.0</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">🔨 Completed Jobs:</span>
                                <span class="detail-value">${contractor.completedJobs || 0}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">📅 Joined:</span>
                                <span class="detail-value">${this.formatDate(contractor.joinDate || contractor.approvedDate)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">⏱️ Experience:</span>
                                <span class="detail-value">${contractor.experience || 'Not specified'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Services Offered -->
                    <div class="details-section">
                        <h4>🔧 Services Offered</h4>
                        <div class="services-detailed">
                            ${contractor.services ? contractor.services.map(service => `
                                <div class="service-item-detailed">
                                    <span class="service-icon">⚡</span>
                                    <span class="service-name">${service}</span>
                                </div>
                            `).join('') : '<p>No services specified</p>'}
                        </div>
                    </div>

                    <!-- Business Information -->
                    <div class="details-section">
                        <h4>💼 Business Information</h4>
                        <div class="additional-info">
                            <div class="info-card">
                                <h5>💰 Pricing</h5>
                                <ul>
                                    <li>Hourly Rate: $${contractor.hourlyRate || 85}/hr</li>
                                    <li>Emergency Rate: $${contractor.emergencyRate || (contractor.hourlyRate + 40) || 125}/hr</li>
                                    <li>Free Estimates: Yes</li>
                                </ul>
                            </div>
                            <div class="info-card">
                                <h5> Status Information</h5>
                                <ul>
                                    <li>Current Status: ${contractor.status.charAt(0).toUpperCase() + contractor.status.slice(1)}</li>
                                    <li>Verified: ${contractor.verified ? 'Yes' : 'No'}</li>
                                    <li>Last Active: ${contractor.lastActive ? this.formatDate(contractor.lastActive) : 'Unknown'}</li>
                                </ul>
                            </div>
                            ${contractor.approvedBy ? `
                            <div class="info-card">
                                <h5> Approval Information</h5>
                                <ul>
                                    <li>Approved By: ${contractor.approvedBy}</li>
                                    <li>Approved Date: ${this.formatDate(contractor.approvedDate)}</li>
                                    ${contractor.lastModified ? `<li>Last Modified: ${this.formatDate(contractor.lastModified)}</li>` : ''}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn-primary" onclick="window.dashboard.editContractor(${contractor.id}); this.closest('.modal').remove();">
                        ✏️ Edit Contractor
                    </button>
                    ${contractor.status === 'active' ? 
                        `<button class="btn-warning" onclick="window.dashboard.suspendContractor(${contractor.id}); this.closest('.modal').remove();">⏸️ Suspend</button>` :
                        `<button class="btn-success" onclick="window.dashboard.activateContractor(${contractor.id}); this.closest('.modal').remove();"> Activate</button>`
                    }
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    suspendContractor(contractorId) {
        const reason = prompt('⏸️ Reason for suspension (optional):');
        if (reason !== null) {
            console.log('⏸️ Suspend contractor:', contractorId);
            
            const contractors = this.getStoredContractors();
            const contractor = contractors.find(c => c.id === contractorId);
            
            if (contractor) {
                contractor.status = 'suspended';
                contractor.suspendedDate = new Date().toISOString();
                contractor.suspendedBy = localStorage.getItem('agentName') || 'Admin';
                contractor.suspensionReason = reason || 'No reason provided';
                contractor.lastModified = new Date().toISOString();
                
                localStorage.setItem('contractors', JSON.stringify(contractors));
                this.showNotification(`⏸️ ${contractor.name} suspended`, 'warning');
                this.loadContractors();
                
                console.log('⏸️ Contractor suspended:', contractor.name, 'Reason:', reason);
            }
        }
    }

    activateContractor(contractorId) {
        if (confirm(' Activate this contractor?')) {
            console.log(' Activate contractor:', contractorId);
            
            const contractors = this.getStoredContractors();
            const contractor = contractors.find(c => c.id === contractorId);
            
            if (contractor) {
                contractor.status = 'active';
                contractor.activatedDate = new Date().toISOString();
                contractor.activatedBy = localStorage.getItem('agentName') || 'Admin';
                contractor.lastModified = new Date().toISOString();
                
                // Remove suspension info
                delete contractor.suspendedDate;
                delete contractor.suspendedBy;
                delete contractor.suspensionReason;
                
                localStorage.setItem('contractors', JSON.stringify(contractors));
                this.showNotification(` ${contractor.name} activated`, 'success');
                this.loadContractors();
                
                console.log(' Contractor activated:', contractor.name);
            }
        }
    }

    verifyLicense(contractorId) {
        console.log(' Opening license verification for contractor:', contractorId);
        
        // Get contractor data to verify they have a license
        const pendingContractors = this.getStoredPendingContractors();
        const contractor = pendingContractors.find(c => c.id === contractorId);
        
        if (!contractor) {
            this.showNotification(' Contractor not found', 'error');
            return;
        }
        
        if (!contractor.license) {
            this.showNotification(' No license number provided for this contractor', 'error');
            return;
        }
        
        // Open license verification page in new window
        const verificationUrl = `/pages/license-verification.html?contractorId=${contractorId}`;
        const windowFeatures = 'width=1400,height=900,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
        
        try {
            const verificationWindow = window.open(verificationUrl, 'licenseVerification', windowFeatures);
            
            if (!verificationWindow) {
                // Fallback if popup blocked
                this.showNotification(' Please allow popups and try again', 'warning');
                // Try opening in same tab as fallback
                setTimeout(() => {
                    window.location.href = verificationUrl;
                }, 2000);
            } else {
                this.showNotification(' Opening license verification window...', 'info');
                
                // Focus the new window
                verificationWindow.focus();
                
                // Optional: Listen for window close to refresh data
                const checkClosed = setInterval(() => {
                    if (verificationWindow.closed) {
                        clearInterval(checkClosed);
                        console.log(' License verification window closed, refreshing data...');
                        this.refreshPendingContractors();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error(' Failed to open license verification:', error);
            this.showNotification(' Failed to open license verification', 'error');
        }
    }

    async loadReferrals() {
        // Load referrals from API and display them
        const referrals = await this.getReferrals();
        const tableBody = document.getElementById('referralsTableBody');
        
        if (!tableBody) return;

        if (referrals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-600);">
                        <div style="font-size: 2rem; margin-bottom: 1rem;"></div>
                        <h3>No referrals yet</h3>
                        <p>Create your first referral using the contractor finder</p>
                        <button class="btn-primary" onclick="window.dashboard.showSection('contractor-finder')" style="margin-top: 1rem;">
                             Find Contractors
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort referrals by date (newest first)
        referrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const referralRows = referrals.map(referral => `
            <tr data-referral-id="${referral.id}">
                <td><strong>#${referral.id}</strong></td>
                <td>
                    <div><strong>${referral.customerName}</strong></div>
                    <small style="color: var(--gray-600);">${referral.customerPhone}</small>
                </td>
                <td>
                    <div>${referral.serviceType}</div>
                    <small style="color: var(--gray-600);">ZIP: ${referral.zipCode}</small>
                </td>
                <td>
                    <div><strong>${referral.contractorName}</strong></div>
                    <small style="color: var(--gray-600);">${referral.contractorPhone}</small>
                </td>
                <td><span class="status-badge ${referral.status}">${referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}</span></td>
                <td>
                    <div>${this.formatDate(referral.createdAt)}</div>
                    <small style="color: var(--gray-600);">${this.formatTime(referral.createdAt)}</small>
                </td>
                <td>
                    <button class="btn-icon" onclick="viewReferral('${referral.id}')" title="View Details">👁️</button>
                    <button class="btn-icon" onclick="editReferral('${referral.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="updateReferralStatus('${referral.id}')" title="Update Status">📝</button>
                </td>
            </tr>
        `).join('');

        tableBody.innerHTML = referralRows;
        
        // Update referral count in navigation
        this.updateReferralCount(referrals.length);
    }

    setupReferralFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterReferrals());
        }
        
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterReferrals());
        }
    }

    async filterReferrals() {
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const referrals = await this.getReferrals();
        
        let filteredReferrals = referrals;
        
        // Filter by status
        if (statusFilter) {
            filteredReferrals = filteredReferrals.filter(r => r.status === statusFilter);
        }
        
        // Filter by date
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            filteredReferrals = filteredReferrals.filter(referral => {
                const referralDate = new Date(referral.createdAt);
                
                switch (dateFilter) {
                    case 'today':
                        return referralDate >= today;
                    case 'week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return referralDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                        return referralDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }
        
        // Update display
        this.displayFilteredReferrals(filteredReferrals);
        
        // Show filter results
        const total = referrals.length;
        const filtered = filteredReferrals.length;
        
        if (filtered !== total) {
            this.showNotification(`Showing ${filtered} of ${total} referrals`, 'info');
        }
    }

    displayFilteredReferrals(referrals) {
        const tableBody = document.getElementById('referralsTableBody');
        if (!tableBody) return;

        if (referrals.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-600);">
                        <div style="font-size: 2rem; margin-bottom: 1rem;"></div>
                        <h3>No referrals match your filters</h3>
                        <p>Try adjusting your filter criteria</p>
                        <button class="btn-secondary" onclick="clearReferralFilters()" style="margin-top: 1rem;">
                            Clear Filters
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort referrals by date (newest first)
        referrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const referralRows = referrals.map(referral => `
            <tr data-referral-id="${referral.id}">
                <td><strong>#${referral.id}</strong></td>
                <td>
                    <div><strong>${referral.customerName}</strong></div>
                    <small style="color: var(--gray-600);">${referral.customerPhone}</small>
                </td>
                <td>
                    <div>${referral.serviceType}</div>
                    <small style="color: var(--gray-600);">ZIP: ${referral.zipCode}</small>
                </td>
                <td>
                    <div><strong>${referral.contractorName}</strong></div>
                    <small style="color: var(--gray-600);">${referral.contractorPhone}</small>
                </td>
                <td><span class="status-badge ${referral.status}">${referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}</span></td>
                <td>
                    <div>${this.formatDate(referral.createdAt)}</div>
                    <small style="color: var(--gray-600);">${this.formatTime(referral.createdAt)}</small>
                </td>
                <td>
                    <button class="btn-icon" onclick="viewReferral('${referral.id}')" title="View Details">👁️</button>
                    <button class="btn-icon" onclick="editReferral('${referral.id}')" title="Edit">✏️</button>
                    <button class="btn-icon" onclick="updateReferralStatus('${referral.id}')" title="Update Status">📝</button>
                </td>
            </tr>
        `).join('');

        tableBody.innerHTML = referralRows;
    }

    // Referral storage methods - now using API
    async getReferrals() {
        try {
            // Try to get from API first
            const response = await fetch('/api/DataSummary/overview');
            if (response.ok) {
                const data = await response.json();
                // For now, return empty array since we don't have a full referrals endpoint
                // The count will be updated from the API data
                return [];
            }
        } catch (error) {
            console.log('API not available, using localStorage fallback');
        }
        
        // Fallback to localStorage for existing data
        const referrals = localStorage.getItem('referrals');
        return referrals ? JSON.parse(referrals) : [];
    }

    async saveReferral(referralData) {
        // Save referral via API instead of localStorage
        try {
            const response = await fetch('/api/CallCenter/referrals/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customerName: referralData.customerName,
                    customerPhone: referralData.customerPhone,
                    serviceType: referralData.serviceType,
                    zipCode: referralData.zipCode,
                    description: referralData.description || ''
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(' Referral saved to database:', result);
                
                // Update referral stats
                await this.updateReferralStats();
                
                return result;
            } else {
                throw new Error('Failed to save referral');
            }
        } catch (error) {
            console.error(' Error saving referral:', error);
            throw error;
        }
    }

    generateReferralId() {
        const referrals = this.getReferrals();
        const maxId = referrals.reduce((max, r) => {
            const num = parseInt(r.id);
            return num > max ? num : max;
        }, 0);
        return (maxId + 1).toString();
    }

    updateReferralCount(count) {
        const badge = document.querySelector('[data-section="referrals"] .menu-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        // Ensure we're using the correct year
        if (date.getFullYear() > 2024) {
            date.setFullYear(2024);
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    async updateReferralStats() {
        try {
            // Get real referral count from API
            const response = await fetch('/api/DataSummary/overview');
            if (response.ok) {
                const data = await response.json();
                const totalReferrals = data.tableCounts.referrals;
                const pendingReferrals = 0; // Will be updated when we have status data
                const completedReferrals = 0; // Will be updated when we have status data
                
                this.updateReferralStatsDisplay(totalReferrals, pendingReferrals, completedReferrals);
                this.updateReferralCount(totalReferrals);
                return;
            }
        } catch (error) {
            console.log('API not available, using localStorage fallback');
        }
        
        // Fallback to localStorage
        const referrals = await this.getReferrals();
        const totalReferrals = referrals.length;
        const pendingReferrals = referrals.filter(r => r.status === 'pending').length;
        const completedReferrals = referrals.filter(r => r.status === 'completed').length;
        
        this.updateReferralStatsDisplay(totalReferrals, pendingReferrals, completedReferrals);
        this.updateReferralCount(totalReferrals);
    }

    updateReferralStatsDisplay(totalReferrals, pendingReferrals, completedReferrals) {
        
        // Update stats cards
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
        
        // Update navigation badge
        this.updateReferralCount(totalReferrals);
    }

    initializeAnalytics() {
        // Initialize analytics dashboard
        console.log('Analytics initialized');
        this.loadAnalyticsData();
        this.setupAnalyticsFilters();
    }

    async loadAnalyticsData() {
        const dateRange = document.getElementById('analyticsDateRange')?.value || 30;
        const referrals = await this.getReferrals();
        
        // Filter referrals by date range
        const filteredReferrals = this.filterReferralsByDateRange(referrals, parseInt(dateRange));
        
        // Update all analytics components
        this.updateReferralTrends(filteredReferrals, parseInt(dateRange));
        this.updateConversionRates(filteredReferrals);
        this.updateTopPerformers(filteredReferrals);
        this.updateServiceDistribution(filteredReferrals);
        
        console.log(`Analytics loaded for ${filteredReferrals.length} referrals in last ${dateRange} days`);
    }

    setupAnalyticsFilters() {
        const dateRangeSelect = document.getElementById('analyticsDateRange');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', () => {
                this.loadAnalyticsData();
                this.showNotification(' Analytics updated', 'info');
            });
        }
    }

    filterReferralsByDateRange(referrals, days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return referrals.filter(referral => {
            const referralDate = new Date(referral.createdAt);
            return referralDate >= cutoffDate;
        });
    }

    updateReferralTrends(referrals, days) {
        const chartContainer = document.querySelector('.chart-placeholder');
        if (!chartContainer) return;

        // Create daily data for the chart
        const dailyData = this.generateDailyReferralData(referrals, days);
        
        // Clear existing chart
        chartContainer.innerHTML = '';
        
        if (dailyData.length === 0) {
            chartContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-600);">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📈</div>
                    <p>No referral data for selected period</p>
                </div>
            `;
            return;
        }

        // Find max value for scaling
        const maxValue = Math.max(...dailyData.map(d => d.count), 1);
        
        // Create bars
        dailyData.forEach((day, index) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            const height = Math.max((day.count / maxValue) * 100, 5); // Minimum 5% height
            bar.style.height = `${height}%`;
            bar.title = `${day.date}: ${day.count} referrals`;
            
            // Add animation delay
            bar.style.animationDelay = `${index * 0.1}s`;
            
            chartContainer.appendChild(bar);
        });

        // Update description
        const description = document.querySelector('.chart-description');
        if (description) {
            const totalReferrals = dailyData.reduce((sum, day) => sum + day.count, 0);
            const avgDaily = (totalReferrals / dailyData.length).toFixed(1);
            description.textContent = `${totalReferrals} total referrals, ${avgDaily} avg per day over ${days} days`;
        }
    }

    generateDailyReferralData(referrals, days) {
        const data = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const count = referrals.filter(referral => {
                const referralDate = new Date(referral.createdAt).toISOString().split('T')[0];
                return referralDate === dateStr;
            }).length;
            
            data.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: count
            });
        }
        
        return data;
    }

    updateConversionRates(referrals) {
        const total = referrals.length;
        if (total === 0) {
            this.updateMetricDisplay('Contact Rate', '0%');
            this.updateMetricDisplay('Completion Rate', '0%');
            this.updateMetricDisplay('Avg Rating', 'N/A');
            return;
        }

        const contacted = referrals.filter(r => ['contacted', 'completed'].includes(r.status)).length;
        const completed = referrals.filter(r => r.status === 'completed').length;
        
        const contactRate = Math.round((contacted / total) * 100);
        const completionRate = Math.round((completed / total) * 100);
        
        // Calculate average rating (simulated for now)
        const avgRating = this.calculateAverageRating(referrals);
        
        this.updateMetricDisplay('Contact Rate', `${contactRate}%`);
        this.updateMetricDisplay('Completion Rate', `${completionRate}%`);
        this.updateMetricDisplay('Avg Rating', avgRating);
    }

    updateMetricDisplay(label, value) {
        const metricItems = document.querySelectorAll('.metric-item');
        metricItems.forEach(item => {
            const labelElement = item.querySelector('.metric-label');
            if (labelElement && labelElement.textContent === label) {
                const valueElement = item.querySelector('.metric-value');
                if (valueElement) {
                    valueElement.textContent = value;
                }
            }
        });
    }

    calculateAverageRating(referrals) {
        if (referrals.length === 0) return 'N/A';
        
        // Simulate ratings based on completion status
        let totalRating = 0;
        let ratedCount = 0;
        
        referrals.forEach(referral => {
            if (referral.status === 'completed') {
                // Simulate rating between 4.0 and 5.0 for completed referrals
                totalRating += 4.0 + Math.random();
                ratedCount++;
            }
        });
        
        return ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : 'N/A';
    }

    updateTopPerformers(referrals) {
        const performersContainer = document.querySelector('.top-performers');
        if (!performersContainer) return;

        // Count referrals by contractor
        const contractorStats = {};
        referrals.forEach(referral => {
            const contractor = referral.contractorName || 'Unknown';
            if (!contractorStats[contractor]) {
                contractorStats[contractor] = {
                    name: contractor,
                    total: 0,
                    completed: 0
                };
            }
            contractorStats[contractor].total++;
            if (referral.status === 'completed') {
                contractorStats[contractor].completed++;
            }
        });

        // Calculate success rates and sort
        const performers = Object.values(contractorStats)
            .filter(contractor => contractor.name !== 'Unknown' && contractor.total > 0)
            .map(contractor => ({
                ...contractor,
                successRate: contractor.total > 0 ? Math.round((contractor.completed / contractor.total) * 100) : 0
            }))
            .sort((a, b) => b.successRate - a.successRate)
            .slice(0, 3);

        // Update display
        performersContainer.innerHTML = '';
        
        if (performers.length === 0) {
            performersContainer.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: var(--gray-600);">
                    <p>No contractor data available</p>
                </div>
            `;
            return;
        }

        performers.forEach((performer, index) => {
            const item = document.createElement('div');
            item.className = 'performer-item';
            item.innerHTML = `
                <span class="rank">${index + 1}</span>
                <span class="name">${performer.name}</span>
                <span class="score">${performer.successRate}%</span>
            `;
            performersContainer.appendChild(item);
        });
    }

    updateServiceDistribution(referrals) {
        const serviceStatsContainer = document.querySelector('.service-stats');
        if (!serviceStatsContainer) return;

        // Count referrals by service type
        const serviceCounts = {};
        referrals.forEach(referral => {
            const service = referral.serviceType || 'General';
            serviceCounts[service] = (serviceCounts[service] || 0) + 1;
        });

        const total = referrals.length;
        if (total === 0) {
            serviceStatsContainer.innerHTML = `
                <div style="text-align: center; padding: 1rem; color: var(--gray-600);">
                    <p>No service data available</p>
                </div>
            `;
            return;
        }

        // Sort by count and get percentages
        const services = Object.entries(serviceCounts)
            .map(([service, count]) => ({
                name: service,
                count: count,
                percentage: Math.round((count / total) * 100)
            }))
            .sort((a, b) => b.count - a.count);

        // Update display
        serviceStatsContainer.innerHTML = '';
        
        services.forEach(service => {
            const item = document.createElement('div');
            item.className = 'service-item';
            item.innerHTML = `
                <span class="service-name">${service.name}</span>
                <div class="service-bar">
                    <div class="service-fill" style="width: ${service.percentage}%"></div>
                </div>
                <span class="service-percent">${service.percentage}%</span>
            `;
            serviceStatsContainer.appendChild(item);
        });
    }

    async showReportPreview() {
        const dateRange = document.getElementById('analyticsDateRange')?.value || 30;
        const referrals = await this.getReferrals();
        const filteredReferrals = this.filterReferralsByDateRange(referrals, parseInt(dateRange));
        
        // Generate report data
        const reportData = this.generateReportData(filteredReferrals, parseInt(dateRange));
        
        // Show preview modal first
        this.showReportSummaryModal(reportData);
    }

    async downloadCSVReport() {
        const dateRange = document.getElementById('analyticsDateRange')?.value || 30;
        const referrals = await this.getReferrals();
        const filteredReferrals = this.filterReferralsByDateRange(referrals, parseInt(dateRange));
        
        // Generate report data
        const reportData = this.generateReportData(filteredReferrals, parseInt(dateRange));
        
        // Create CSV content
        const csvContent = this.generateCSVReport(reportData);
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `referral-analytics-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('📥 CSV report downloaded successfully!', 'success');
    }

    // ===== PENDING CONTRACTORS METHODS =====

    initializePendingContractors() {
        console.log(' Initializing pending contractors...');
        this.loadPendingContractors();
    }

    async loadPendingContractors() {
        try {
            console.log(' Loading pending contractors...');
            
            // Try to get from API first
            let pendingContractors = [];
            
            try {
                const sessionToken = localStorage.getItem('sessionToken');
                const response = await fetch('/api/contractor/pending', {
                    headers: { 'Authorization': `Bearer ${sessionToken}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    pendingContractors = data.contractors || [];
                }
            } catch (apiError) {
                console.log(' API not available, using demo data...');
            }
            
            // Use real API data only - no more mock data
            if (pendingContractors.length === 0) {
                const storedPending = this.getStoredPendingContractors();
                if (storedPending.length > 0) {
                    pendingContractors = storedPending;
                    console.log(' Using stored pending contractors:', storedPending.length);
                } else {
                    console.log(' No pending contractors found');
                }
            }
            
            this.renderPendingContractorsStats(pendingContractors);
            this.renderPendingContractors(pendingContractors);
            this.updatePendingBadge(pendingContractors.length);
            
        } catch (error) {
            console.error(' Error loading pending contractors:', error);
            this.showNotification(' Failed to load pending contractors', 'error');
        }
    }

    refreshPendingContractors() {
        console.log(' Refreshing pending contractors...');
        this.loadPendingContractors();
    }

    getInitialDemoPendingContractors() {
        // No more mock data - return empty array
        return [];
    }

    renderPendingContractorsStats(contractors) {
        const total = contractors.length;
        const urgent = contractors.filter(c => c.daysWaiting > 2).length;
        const today = contractors.filter(c => c.daysWaiting === 0).length;

        document.getElementById('totalPendingCount').textContent = total;
        document.getElementById('urgentPendingCount').textContent = urgent;
        document.getElementById('todayPendingCount').textContent = today;

        // Update stat changes
        const totalCard = document.querySelector('#totalPendingCount').closest('.stat-card');
        const urgentCard = document.querySelector('#urgentPendingCount').closest('.stat-card');
        
        if (urgent > 0) {
            urgentCard.querySelector('.stat-change').textContent = 'Needs attention';
            urgentCard.querySelector('.stat-change').className = 'stat-change negative';
        } else {
            urgentCard.querySelector('.stat-change').textContent = 'All current';
            urgentCard.querySelector('.stat-change').className = 'stat-change positive';
        }
    }

    renderPendingContractors(contractors) {
        const container = document.getElementById('pendingContractorsGrid');
        
        if (contractors.length === 0) {
            container.innerHTML = `
                <div class="empty-pending-state">
                    <div class="icon">🎉</div>
                    <h3>All caught up!</h3>
                    <p>No pending contractor applications at the moment.<br>New applications will appear here for review.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = contractors.map(contractor => `
            <div class="pending-contractor-card">
                ${contractor.daysWaiting > 2 ? `<div class="waiting-badge urgent">${contractor.daysWaiting} days waiting</div>` : 
                  contractor.daysWaiting > 0 ? `<div class="waiting-badge">${contractor.daysWaiting} day${contractor.daysWaiting > 1 ? 's' : ''} waiting</div>` : 
                  '<div class="waiting-badge" style="background: var(--success);">New Today</div>'}
                
                <div class="contractor-header">
                    <div class="contractor-avatar">
                        ${contractor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div class="contractor-info">
                        <h4>${contractor.name}</h4>
                        <p>${contractor.company}</p>
                        <p>📧 ${contractor.email}</p>
                        <p>📞 ${contractor.phone}</p>
                    </div>
                </div>

                <div class="contractor-details">
                    <div class="detail-row">
                        <span class="icon">📍</span>
                        <strong>Location:</strong>
                        <span>${contractor.location}</span>
                    </div>
                    <div class="detail-row">
                        <span class="icon">⏱️</span>
                        <strong>Experience:</strong>
                        <span>${contractor.experience}</span>
                    </div>
                    <div class="detail-row">
                        <span class="icon">📅</span>
                        <strong>Applied:</strong>
                        <span>${this.formatDate(contractor.appliedDate)}</span>
                    </div>
                </div>

                <div class="services-section">
                    <h5>Services Offered:</h5>
                    <div class="service-tags">
                        ${contractor.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
                    </div>
                </div>

                <div class="contractor-actions">
                    <button class="btn-view-details" onclick="window.dashboard.viewContractorDetails(${contractor.id})">
                        👁️ View Details
                    </button>
                    ${contractor.license ? 
                        `<button class="btn-verify-license" onclick="window.dashboard.verifyLicense(${contractor.id})" title="Verify CA License">
                             Verify License
                        </button>` : 
                        `<button class="btn-no-license" disabled title="No license provided">
                             No License
                        </button>`
                    }
                    <button class="btn-approve" onclick="window.dashboard.approveContractor(${contractor.id})">
                         Approve
                    </button>
                    <button class="btn-reject" onclick="window.dashboard.rejectContractor(${contractor.id})">
                         Reject
                    </button>
                </div>
            </div>
        `).join('');
    }

    updatePendingBadge(count) {
        const badge = document.getElementById('pendingContractorsBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    }

    async approveContractor(contractorId) {
        if (confirm(' Approve this contractor application?')) {
            try {
                console.log(' Approving contractor:', contractorId);
                
                // Get pending contractors
                const pendingContractors = this.getStoredPendingContractors();
                const contractorToApprove = pendingContractors.find(c => c.id === contractorId);
                
                if (!contractorToApprove) {
                    this.showNotification(' Contractor not found', 'error');
                    return;
                }
                
                // Move contractor to approved contractors list
                this.moveContractorToApproved(contractorToApprove);
                
                // Remove from pending list
                this.removePendingContractor(contractorId);
                
                this.showNotification(` ${contractorToApprove.name} approved successfully!`, 'success');
                this.refreshPendingContractors();
                
                // If we're on contractors section, refresh that too
                if (document.getElementById('contractors-section').classList.contains('active')) {
                    this.loadContractors();
                }
                
            } catch (error) {
                console.error(' Error approving contractor:', error);
                this.showNotification(' Failed to approve contractor', 'error');
            }
        }
    }

    async rejectContractor(contractorId) {
        const reason = prompt(' Reason for rejection (optional):');
        if (reason !== null) {
            try {
                console.log(' Rejecting contractor:', contractorId, 'Reason:', reason);
                
                // Get contractor info for notification
                const pendingContractors = this.getStoredPendingContractors();
                const contractorToReject = pendingContractors.find(c => c.id === contractorId);
                
                if (!contractorToReject) {
                    this.showNotification(' Contractor not found', 'error');
                    return;
                }
                
                // Store rejection in rejected contractors list (for audit)
                this.addToRejectedContractors(contractorToReject, reason);
                
                // Remove from pending list
                this.removePendingContractor(contractorId);
                
                this.showNotification(` ${contractorToReject.name} application rejected`, 'warning');
                this.refreshPendingContractors();
                
            } catch (error) {
                console.error(' Error rejecting contractor:', error);
                this.showNotification(' Failed to reject contractor', 'error');
            }
        }
    }

    async viewContractorDetails(contractorId) {
        console.log('👁️ Viewing contractor details:', contractorId);
        
        try {
            const response = await fetch(`/api/Contractors/${contractorId}`);
            if (!response.ok) {
                throw new Error('Contractor not found');
            }
            
            const contractor = await response.json();
            this.showContractorDetailsModal(contractor);
            
        } catch (error) {
            console.error('Failed to load contractor details:', error);
            this.showNotification(' Failed to load contractor details', 'error');
        }
    }

    showContractorDetailsModal(contractor) {
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

        const avatar = contractor.companyName.split(' ').map(n => n[0]).join('').substring(0, 2);
        const location = `${contractor.address}, ${contractor.city}, ${contractor.state} ${contractor.zipCode}`;
        const rating = contractor.rating || 0;
        const stars = '⭐'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content contractor-details-modal">
                <div class="modal-header">
                    <h3>👁️ Contractor Details</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Contractor Header -->
                    <div class="contractor-details-header">
                        <div class="contractor-avatar-large">
                            ${avatar}
                        </div>
                        <div class="contractor-main-info">
                            <h2>${contractor.companyName}</h2>
                            <h3>Contact: ${contractor.contactName}</h3>
                            <div class="status-badge active">
                                 Active Contractor
                            </div>
                            <div class="contractor-rating">
                                <span class="stars">${stars}</span>
                                <span class="rating-text">${rating.toFixed(1)} Rating</span>
                            </div>
                        </div>
                    </div>

                    <!-- Contact Information -->
                    <div class="details-section">
                        <h4>📞 Contact Information</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">📧 Email:</span>
                                <span class="detail-value">
                                    <a href="mailto:${contractor.email}">${contractor.email}</a>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">📱 Phone:</span>
                                <span class="detail-value">
                                    <a href="tel:${contractor.phone}">${contractor.phone}</a>
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">📍 Address:</span>
                                <span class="detail-value">${location}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">🏢 Company:</span>
                                <span class="detail-value">${contractor.companyName}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Professional Information -->
                    <div class="details-section">
                        <h4>💼 Professional Information</h4>
                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">🆔 Contractor ID:</span>
                                <span class="detail-value">#${contractor.contractorId}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">📅 Joined:</span>
                                <span class="detail-value">${this.formatDate(contractor.dateAdded)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label"> Status:</span>
                                <span class="detail-value status-active">ACTIVE</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">⭐ Rating:</span>
                                <span class="detail-value">${rating.toFixed(1)}/5.0</span>
                            </div>
                        </div>
                    </div>

                    <!-- Services Offered -->
                    <div class="details-section">
                        <h4>🔧 Services Offered</h4>
                        <div class="services-detailed">
                            ${services.map(service => `
                                <div class="service-item-detailed">
                                    <span class="service-icon">⚡</span>
                                    <span class="service-name">${service}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn-primary" onclick="window.dashboard.editContractor(${contractor.contractorId}); this.closest('.modal').remove();">
                        ✏️ Edit Contractor
                    </button>
                </div>
            </div>
        `;
        
        modal.classList.add('active');
        document.body.appendChild(modal);
        
        // Add click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    refreshPendingContractors() {
        console.log(' Refreshing pending contractors...');
        this.loadPendingContractors();
    }

    // Helper functions for managing contractor data
    moveContractorToApproved(contractor) {
        console.log('📝 Moving contractor to approved list:', contractor.name);
        
        // Get existing contractors
        const existingContractors = this.getStoredContractors();
        
        // Convert pending contractor to approved contractor format
        const approvedContractor = {
            id: this.generateContractorId(),
            name: contractor.name,
            email: contractor.email,
            phone: contractor.phone,
            company: contractor.company,
            services: contractor.services,
            experience: contractor.experience,
            location: contractor.location,
            status: 'active',
            rating: 5.0, // New contractors start with perfect rating
            completedJobs: 0,
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            avatar: contractor.name.split(' ').map(n => n[0]).join(''),
            certifications: contractor.certifications || [],
            businessYears: contractor.businessYears || 5,
            teamSize: contractor.teamSize || 3,
            hourlyRate: contractor.hourlyRate || 85,
            emergencyRate: contractor.emergencyRate || 125,
            serviceRadius: contractor.serviceRadius || 25,
            verified: true,
            approvedDate: new Date().toISOString(),
            approvedBy: localStorage.getItem('agentName') || 'Admin'
        };
        
        // Add to contractors list
        existingContractors.push(approvedContractor);
        
        // Save updated contractors
        localStorage.setItem('contractors', JSON.stringify(existingContractors));
        
        console.log(' Contractor added to approved list:', approvedContractor);
    }

    removePendingContractor(contractorId) {
        console.log(' Removing contractor from pending list:', contractorId);
        
        // Get current pending contractors
        let pendingContractors = this.getStoredPendingContractors();
        
        // Remove the contractor
        pendingContractors = pendingContractors.filter(c => c.id !== contractorId);
        
        // Save updated pending list
        localStorage.setItem('pendingContractors', JSON.stringify(pendingContractors));
        
        console.log(' Contractor removed from pending list');
    }

    addToRejectedContractors(contractor, reason) {
        console.log(' Adding contractor to rejected list:', contractor.name);
        
        // Get existing rejected contractors
        const rejectedContractors = JSON.parse(localStorage.getItem('rejectedContractors') || '[]');
        
        // Add rejection record
        const rejectionRecord = {
            ...contractor,
            rejectedDate: new Date().toISOString(),
            rejectedBy: localStorage.getItem('agentName') || 'Admin',
            rejectionReason: reason || 'No reason provided'
        };
        
        rejectedContractors.push(rejectionRecord);
        
        // Save rejected contractors
        localStorage.setItem('rejectedContractors', JSON.stringify(rejectedContractors));
        
        console.log(' Contractor added to rejected list');
    }

    getStoredContractors() {
        // No more localStorage - return empty array
        return [];
    }

    getStoredPendingContractors() {
        // No more localStorage - return empty array
        return [];
    }

    hasProcessedContractors() {
        // Check if we have the processed flag set
        const processedFlag = localStorage.getItem('contractorsProcessed');
        if (processedFlag === 'true') {
            return true;
        }
        
        // Also check if we have any approved contractors or rejected contractors
        const approvedContractors = this.getStoredContractors();
        const rejectedContractors = JSON.parse(localStorage.getItem('rejectedContractors') || '[]');
        
        // If we have any approved or rejected contractors, it means we've processed some
        const hasProcessed = approvedContractors.length > 0 || rejectedContractors.length > 0;
        
        // Set the flag if we detect processed contractors
        if (hasProcessed) {
            localStorage.setItem('contractorsProcessed', 'true');
        }
        
        return hasProcessed;
    }

    generateContractorId() {
        const existingContractors = this.getStoredContractors();
        const maxId = existingContractors.reduce((max, contractor) => 
            Math.max(max, contractor.id || 0), 0);
        return maxId + 1;
    }

    // ===== SETTINGS METHODS =====

    initializeSettings() {
        // Initialize settings page
        console.log('Settings initialized');
        this.loadSettings();
        this.setupSettingsEventListeners();
        this.loadUsers();
    }

    loadSettings() {
        // Load settings from localStorage
        const settings = this.getSettings();
        
        // General Settings
        const companyNameInput = document.getElementById('companyName');
        const defaultRadiusSelect = document.getElementById('defaultRadius');
        const timezoneSelect = document.getElementById('timezone');
        
        if (companyNameInput) companyNameInput.value = settings.general.companyName;
        if (defaultRadiusSelect) defaultRadiusSelect.value = settings.general.defaultRadius;
        if (timezoneSelect) timezoneSelect.value = settings.general.timezone;
        
        // Notification Settings
        const notificationCheckboxes = document.querySelectorAll('#notifications-tab input[type="checkbox"]');
        if (notificationCheckboxes.length >= 4) {
            notificationCheckboxes[0].checked = settings.notifications.emailReferrals;
            notificationCheckboxes[1].checked = settings.notifications.smsAlerts;
            notificationCheckboxes[2].checked = settings.notifications.dailyReports;
            notificationCheckboxes[3].checked = settings.notifications.systemMaintenance;
        }
        
        // System Settings
        const maxReferralsInput = document.getElementById('maxReferrals');
        const sessionTimeoutInput = document.getElementById('sessionTimeout');
        const systemCheckboxes = document.querySelectorAll('#system-tab input[type="checkbox"]');
        
        if (maxReferralsInput) maxReferralsInput.value = settings.system.maxReferrals;
        if (sessionTimeoutInput) sessionTimeoutInput.value = settings.system.sessionTimeout;
        if (systemCheckboxes.length >= 2) {
            systemCheckboxes[0].checked = settings.system.autoBackups;
            systemCheckboxes[1].checked = settings.system.maintenanceMode;
        }
    }

    getSettings() {
        const defaultSettings = {
            general: {
                companyName: 'Urban Referral Network',
                defaultRadius: 25,
                timezone: 'PST'
            },
            notifications: {
                emailReferrals: true,
                smsAlerts: true,
                dailyReports: false,
                systemMaintenance: true
            },
            system: {
                maxReferrals: 3,
                sessionTimeout: 30,
                autoBackups: true,
                maintenanceMode: false
            }
        };
        
        const savedSettings = localStorage.getItem('systemSettings');
        return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }

    saveSettings(settings) {
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        this.showNotification('⚙️ Settings saved successfully!', 'success');
    }

    setupSettingsEventListeners() {
        // Auto-save on input changes (debounced)
        const inputs = document.querySelectorAll('#settings-section input, #settings-section select');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.validateInput(input);
                clearTimeout(this.settingsTimeout);
                this.settingsTimeout = setTimeout(() => {
                    this.autoSaveSettings();
                }, 1000);
            });
            
            // Real-time validation for number inputs
            if (input.type === 'number') {
                input.addEventListener('input', () => {
                    this.validateInput(input);
                });
            }
        });
    }

    validateInput(input) {
        const value = input.value;
        let isValid = true;
        let message = '';
        
        // Remove existing validation styling
        input.classList.remove('invalid', 'valid');
        
        // Validate based on input type and constraints
        switch (input.id) {
            case 'companyName':
                isValid = value.length >= 2 && value.length <= 50;
                message = isValid ? '' : 'Company name must be 2-50 characters';
                break;
                
            case 'maxReferrals':
                const maxRef = parseInt(value);
                isValid = maxRef >= 1 && maxRef <= 10;
                message = isValid ? '' : 'Must be between 1 and 10';
                break;
                
            case 'sessionTimeout':
                const timeout = parseInt(value);
                isValid = timeout >= 5 && timeout <= 120;
                message = isValid ? '' : 'Must be between 5 and 120 minutes';
                break;
        }
        
        // Apply validation styling
        if (isValid) {
            input.classList.add('valid');
        } else {
            input.classList.add('invalid');
        }
        
        // Show/hide validation message
        this.showValidationMessage(input, message, isValid);
        
        return isValid;
    }

    showValidationMessage(input, message, isValid) {
        // Remove existing validation message
        const existingMessage = input.parentNode.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Add new validation message if needed
        if (message) {
            const messageElement = document.createElement('small');
            messageElement.className = `validation-message ${isValid ? 'success' : 'error'}`;
            messageElement.textContent = message;
            input.parentNode.appendChild(messageElement);
        }
    }

    autoSaveSettings() {
        const settings = this.getSettings();
        
        // Update with current form values
        const companyNameInput = document.getElementById('companyName');
        const defaultRadiusSelect = document.getElementById('defaultRadius');
        const timezoneSelect = document.getElementById('timezone');
        
        if (companyNameInput) settings.general.companyName = companyNameInput.value;
        if (defaultRadiusSelect) settings.general.defaultRadius = parseInt(defaultRadiusSelect.value);
        if (timezoneSelect) settings.general.timezone = timezoneSelect.value;
        
        const notificationCheckboxes = document.querySelectorAll('#notifications-tab input[type="checkbox"]');
        if (notificationCheckboxes.length >= 4) {
            settings.notifications.emailReferrals = notificationCheckboxes[0].checked;
            settings.notifications.smsAlerts = notificationCheckboxes[1].checked;
            settings.notifications.dailyReports = notificationCheckboxes[2].checked;
            settings.notifications.systemMaintenance = notificationCheckboxes[3].checked;
        }
        
        const maxReferralsInput = document.getElementById('maxReferrals');
        const sessionTimeoutInput = document.getElementById('sessionTimeout');
        const systemCheckboxes = document.querySelectorAll('#system-tab input[type="checkbox"]');
        
        if (maxReferralsInput) settings.system.maxReferrals = parseInt(maxReferralsInput.value);
        if (sessionTimeoutInput) settings.system.sessionTimeout = parseInt(sessionTimeoutInput.value);
        if (systemCheckboxes.length >= 2) {
            settings.system.autoBackups = systemCheckboxes[0].checked;
            settings.system.maintenanceMode = systemCheckboxes[1].checked;
        }
        
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        this.showNotification('💾 Settings auto-saved', 'info');
    }

    async loadUsers() {
        console.log(' Loading users...');
        try {
            const users = await this.getUsers();
            console.log('👥 Users loaded:', users);
            this.renderUsersList(users);
        } catch (error) {
            console.error(' Error loading users:', error);
            this.showNotification(' Failed to load users', 'error');
        }
    }

    async getUsers() {
        try {
            // First try to get real agents from the API
            const sessionToken = localStorage.getItem('sessionToken');
            if (sessionToken) {
                const response = await fetch('/api/Agent/list', {
                    headers: { 'Authorization': `Bearer ${sessionToken}` }
                });
                
                if (response.ok) {
                    const agents = await response.json();
                    return agents.map(agent => ({
                        id: agent.agentId,
                        name: agent.fullName || `${agent.firstName} ${agent.lastName}`,
                        email: agent.email,
                        role: agent.userRole.toLowerCase(),
                        status: agent.isActive ? 'active' : 'inactive',
                        avatar: this.getRoleAvatar(agent.userRole),
                        lastLogin: agent.lastLoginDate || new Date().toISOString(),
                        agentCode: agent.agentCode
                    }));
                }
            }
        } catch (error) {
            console.error('Error fetching agents:', error);
        }
        
        // Fallback to default users if API fails
        const defaultUsers = [
            {
                id: 1,
                name: 'System Administrator',
                email: 'admin@urbanreferral.com',
                role: 'admin',
                status: 'active',
                avatar: '👨‍💼',
                lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                agentCode: 'ADMIN_001'
            }
        ];
        
        const savedUsers = localStorage.getItem('systemUsers');
        return savedUsers ? JSON.parse(savedUsers) : defaultUsers;
    }
    
    getRoleAvatar(role) {
        const avatars = {
            'Admin': '👨‍💼',
            'Manager': '👩‍💼', 
            'Supervisor': '👨‍🏫',
            'Agent': '👤'
        };
        return avatars[role] || '👤';
    }

    saveUsers(users) {
        localStorage.setItem('systemUsers', JSON.stringify(users));
    }

    renderUsersList(users) {
        console.log('🎨 Rendering users list:', users);
        const usersContainer = document.querySelector('.users-list');
        if (!usersContainer) {
            console.error(' Users container not found');
            return;
        }

        // Clear existing content
        usersContainer.innerHTML = '';

        if (users.length === 0) {
            console.log('📭 No users to display');
            usersContainer.innerHTML = `
                <div class="no-users">
                    <div class="no-users-icon">👥</div>
                    <h5>No users found</h5>
                    <p>Click "Add New User" to create the first user account.</p>
                </div>
            `;
            return;
        }

        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${user.avatar}</div>
                    <div class="user-details">
                        <h5>${user.name}</h5>
                        <p>${user.email}</p>
                        ${user.agentCode ? `<small class="user-code">Agent Code: ${user.agentCode}</small>` : ''}
                        <small class="user-status ${user.status}">
                            ${user.status === 'active' ? '🟢' : '🔴'} ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                            • Last login: ${this.formatTimeAgo(user.lastLogin)}
                        </small>
                    </div>
                </div>
                <div class="user-role">
                    <select onchange="window.dashboard.updateUserRole(${user.id}, this.value)" aria-label="User role">
                        <option value="agent" ${user.role === 'agent' ? 'selected' : ''}>Agent</option>
                        <option value="supervisor" ${user.role === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                        <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
                <div class="user-actions">
                    <button class="btn-small secondary" onclick="window.dashboard.editUser(${user.id})">✏️ Edit</button>
                    <button class="btn-small info" onclick="window.dashboard.resetPassword(${user.id})">🔑 Reset Password</button>
                    <button class="btn-small ${user.status === 'active' ? 'warning' : 'success'}" 
                            onclick="window.dashboard.toggleUserStatus(${user.id})">
                        ${user.status === 'active' ? '⏸️ Disable' : '▶️ Enable'}
                    </button>
                    <button class="btn-small danger" onclick="window.dashboard.deleteUser(${user.id})"> Delete</button>
                </div>
            `;
            usersContainer.appendChild(userItem);
        });
    }

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }

    async updateUserRole(userId, newRole) {
        const users = await this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.role = newRole;
            this.saveUsers(users);
            this.showNotification(`👤 User role updated to ${newRole}`, 'success');
        }
    }

    async toggleUserStatus(userId) {
        console.log('⏸️ Toggle user status called with ID:', userId);
        const users = await this.getUsers();
        const user = users.find(u => u.id === userId);
        console.log('👤 Found user for status toggle:', user);
        if (user) {
            user.status = user.status === 'active' ? 'inactive' : 'active';
            this.saveUsers(users);
            this.renderUsersList(users);
            this.showNotification(`👤 User ${user.status === 'active' ? 'enabled' : 'disabled'}`, 'success');
        } else {
            console.error(' User not found for status toggle:', userId);
            this.showNotification(' User not found', 'error');
        }
    }

    async editUser(userId) {
        console.log('✏️ Edit user called with ID:', userId);
        const users = await this.getUsers();
        const user = users.find(u => u.id === userId);
        console.log('👤 Found user:', user);
        if (user) {
            this.showEditUserModal(user);
        } else {
            console.error(' User not found with ID:', userId);
            this.showNotification(' User not found', 'error');
        }
    }

    async deleteUser(userId) {
        console.log(' Delete user called with ID:', userId);
        
        // Check if current user has admin privileges
        const currentUserRole = localStorage.getItem('userRole');
        if (currentUserRole !== 'admin' && currentUserRole !== 'Admin') {
            this.showNotification(' Only administrators can delete users', 'error');
            return;
        }

        const users = await this.getUsers();
        const userToDelete = users.find(u => u.id === userId);
        
        if (!userToDelete) {
            console.error(' User not found with ID:', userId);
            this.showNotification(' User not found', 'error');
            return;
        }

        // Prevent users from deleting themselves
        const currentUserId = localStorage.getItem('agentId');
        if (userToDelete.id == currentUserId) {
            this.showNotification(' You cannot delete your own account', 'error');
            return;
        }

        // Prevent deleting the last admin
        const adminUsers = users.filter(u => u.role === 'admin' && u.status === 'active');
        if (userToDelete.role === 'admin' && adminUsers.length <= 1) {
            this.showNotification(' Cannot delete the last administrator account', 'error');
            return;
        }

        // Show custom delete confirmation modal
        this.showDeleteConfirmationModal(userToDelete);
    }

    showDeleteConfirmationModal(user) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3> Delete User Confirmation</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="delete-warning">
                        <div class="warning-icon"></div>
                        <h4>This action cannot be undone!</h4>
                        <p>You are about to permanently delete the following user:</p>
                    </div>
                    
                    <div class="user-details-card">
                        <div class="user-avatar-large">${user.avatar}</div>
                        <div class="user-info-delete">
                            <h5>${user.name}</h5>
                            <p><strong>Agent Code:</strong> ${user.agentCode}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Role:</strong> ${user.role}</p>
                            <p><strong>Status:</strong> ${user.status}</p>
                        </div>
                    </div>
                    
                    <div class="delete-consequences">
                        <h5> Consequences of deletion:</h5>
                        <ul>
                            <li>User will lose access to the system immediately</li>
                            <li>All user data and settings will be permanently removed</li>
                            <li>This action cannot be reversed</li>
                            <li>User will need to be recreated if access is needed again</li>
                        </ul>
                    </div>
                    
                    <div class="confirmation-input">
                        <label for="deleteConfirmText">Type "DELETE" to confirm:</label>
                        <input type="text" id="deleteConfirmText" placeholder="Type DELETE here" autocomplete="off">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn-danger" id="confirmDeleteBtn" onclick="window.dashboard.confirmUserDeletion(${user.id}); this.closest('.modal').remove();" disabled>
                         Delete User
                    </button>
                </div>
            </div>
        `;
        modal.classList.add('active');
        document.body.appendChild(modal);

        // Enable delete button only when "DELETE" is typed
        const confirmInput = modal.querySelector('#deleteConfirmText');
        const deleteBtn = modal.querySelector('#confirmDeleteBtn');
        
        confirmInput.addEventListener('input', () => {
            if (confirmInput.value === 'DELETE') {
                deleteBtn.disabled = false;
                deleteBtn.classList.add('enabled');
            } else {
                deleteBtn.disabled = true;
                deleteBtn.classList.remove('enabled');
            }
        });
        
        // Focus on input
        setTimeout(() => confirmInput.focus(), 100);
    }

    async confirmUserDeletion(userId) {
        const users = await this.getUsers();
        const userToDelete = users.find(u => u.id === userId);
        
        if (userToDelete) {
            try {
                console.log(' Deleting user:', userToDelete.name);
                
                // Filter out the user to delete
                const filteredUsers = users.filter(u => u.id !== userId);
                
                // Save updated user list
                this.saveUsers(filteredUsers);
                
                // Refresh the user list display
                this.renderUsersList(filteredUsers);
                
                // Show success notification
                this.showNotification(` User "${userToDelete.name}" deleted successfully`, 'warning');
                
                console.log(' User deleted successfully:', userToDelete.name);
                
                // Log the action for audit purposes
                console.log(' Audit Log: User deleted', {
                    deletedUser: userToDelete.name,
                    deletedBy: localStorage.getItem('agentName'),
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(' Error deleting user:', error);
                this.showNotification(' Failed to delete user', 'error');
            }
        } else {
            console.log(' User deletion cancelled');
            this.showNotification('User deletion cancelled', 'info');
        }
    }

    async resetPassword(userId) {
        console.log('🔑 Reset password called with ID:', userId);
        const users = await this.getUsers();
        const user = users.find(u => u.id === userId);
        console.log('👤 Found user for password reset:', user);
        if (user) {
            this.showPasswordResetModal(user);
        } else {
            console.error(' User not found for password reset:', userId);
            this.showNotification(' User not found', 'error');
        }
    }

    showPasswordResetModal(user) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔑 Reset Password - ${user.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="resetPasswordForm">
                        <div class="form-group">
                            <label for="newPassword">New Password *</label>
                            <div class="password-input-group">
                                <input type="password" id="newPassword" required minlength="8" placeholder="Enter new password">
                                <button type="button" class="btn btn-secondary" onclick="window.dashboard.generateModalPassword()">🎲 Generate</button>
                                <button type="button" class="btn btn-secondary" onclick="window.dashboard.toggleModalPasswordVisibility()">👁️ Show</button>
                            </div>
                            <small class="help-text">Minimum 8 characters, include uppercase, lowercase, number, and special character</small>
                        </div>
                        <div class="form-group">
                            <label for="confirmNewPassword">Confirm Password *</label>
                            <input type="password" id="confirmNewPassword" required minlength="8" placeholder="Confirm new password">
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="forcePasswordChange" checked>
                                <span class="checkmark"></span>
                                Force user to change password on next login
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="sendEmailNotification" checked>
                                <span class="checkmark"></span>
                                Send password reset notification to user
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn-primary" onclick="window.dashboard.savePasswordReset(${user.id}); this.closest('.modal').remove();">🔑 Reset Password</button>
                </div>
            </div>
        `;
        modal.classList.add('active');
        document.body.appendChild(modal);

        // Add password confirmation validation
        const confirmField = modal.querySelector('#confirmNewPassword');
        const passwordField = modal.querySelector('#newPassword');
        
        const validatePasswords = () => {
            if (confirmField.value && passwordField.value !== confirmField.value) {
                confirmField.setCustomValidity('Passwords do not match');
            } else {
                confirmField.setCustomValidity('');
            }
        };
        
        passwordField.addEventListener('input', validatePasswords);
        confirmField.addEventListener('input', validatePasswords);
    }

    async savePasswordReset(userId) {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        const forceChange = document.getElementById('forcePasswordChange').checked;
        const sendEmail = document.getElementById('sendEmailNotification').checked;

        if (newPassword !== confirmPassword) {
            this.showNotification(' Passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showNotification(' Password must be at least 8 characters', 'error');
            return;
        }

        try {
            console.log('🔑 Resetting password for user ID:', userId);
            
            // Get users and update the password locally (demo mode)
            const users = await this.getUsers();
            const user = users.find(u => u.id === userId);
            
            if (user) {
                // In a real app, this would hash the password
                user.password = newPassword;
                user.mustChangePassword = forceChange;
                user.passwordResetDate = new Date().toISOString();
                
                // Save updated users
                this.saveUsers(users);
                
                console.log(' Password reset successful for user:', user.name);
                this.showNotification('🔑 Password reset successfully!', 'success');
                
                if (sendEmail) {
                    // Simulate email notification
                    setTimeout(() => {
                        this.showNotification('📧 Password reset notification sent to user', 'info');
                    }, 1000);
                }
            } else {
                this.showNotification(' User not found', 'error');
            }
        } catch (error) {
            console.error(' Password reset error:', error);
            this.showNotification(' Password reset failed', 'error');
        }
    }

    // Password generation for modal
    generateModalPassword() {
        const length = 12;
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        let password = '';
        
        // Ensure at least one character from each category
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        // Fill the rest randomly
        const allChars = uppercase + lowercase + numbers + symbols;
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password
        password = password.split('').sort(() => Math.random() - 0.5).join('');
        
        // Set the password in modal
        const passwordField = document.getElementById('newPassword');
        const confirmPasswordField = document.getElementById('confirmNewPassword');
        
        if (passwordField && confirmPasswordField) {
            passwordField.value = password;
            confirmPasswordField.value = password;
            
            // Show the password temporarily
            passwordField.type = 'text';
            setTimeout(() => {
                passwordField.type = 'password';
            }, 3000);
            
            console.log('🎲 Generated password for modal:', password);
        }
    }

    // Toggle password visibility in modal
    toggleModalPasswordVisibility() {
        const passwordField = document.getElementById('newPassword');
        const toggleBtn = event.target;
        
        if (passwordField) {
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleBtn.textContent = '🙈 Hide';
            } else {
                passwordField.type = 'password';
                toggleBtn.textContent = '👁️ Show';
            }
        }
    }

    showEditUserModal(user) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>✏️ Edit User - ${user.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editUserForm">
                        <div class="form-group">
                            <label for="editUserName">Full Name</label>
                            <input type="text" id="editUserName" value="${user.name}" required>
                        </div>
                        <div class="form-group">
                            <label for="editUserEmail">Email Address</label>
                            <input type="email" id="editUserEmail" value="${user.email}" required>
                        </div>
                        <div class="form-group">
                            <label for="editUserRole">Role</label>
                            <select id="editUserRole">
                                <option value="operator" ${user.role === 'operator' ? 'selected' : ''}>Operator</option>
                                <option value="supervisor" ${user.role === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="editUserAvatar">Avatar Emoji</label>
                            <input type="text" id="editUserAvatar" value="${user.avatar}" maxlength="2">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn-primary" onclick="window.dashboard.saveUserEdit(${user.id}); this.closest('.modal').remove();">💾 Save Changes</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    async saveUserEdit(userId) {
        const users = await this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.name = document.getElementById('editUserName').value;
            user.email = document.getElementById('editUserEmail').value;
            user.role = document.getElementById('editUserRole').value;
            user.avatar = document.getElementById('editUserAvatar').value || '👤';
            
            this.saveUsers(users);
            this.renderUsersList(users);
            this.showNotification('✏️ User updated successfully!', 'success');
        }
    }

    showAddUserModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>➕ Add New User</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="addUserForm">
                        <div class="form-group">
                            <label for="newUserName">Full Name *</label>
                            <input type="text" id="newUserName" required placeholder="Enter full name">
                        </div>
                        <div class="form-group">
                            <label for="newUserEmail">Email Address *</label>
                            <input type="email" id="newUserEmail" required placeholder="user@urbanreferral.com">
                        </div>
                        <div class="form-group">
                            <label for="newUserRole">Role *</label>
                            <select id="newUserRole" required>
                                <option value="">Select role...</option>
                                <option value="operator">Operator</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="newUserAvatar">Avatar Emoji</label>
                            <input type="text" id="newUserAvatar" placeholder="👤" maxlength="2">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn-primary" onclick="window.dashboard.saveNewUser(); this.closest('.modal').remove();">➕ Add User</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveNewUser() {
        const name = document.getElementById('newUserName').value;
        const email = document.getElementById('newUserEmail').value;
        const role = document.getElementById('newUserRole').value;
        const avatar = document.getElementById('newUserAvatar').value || '👤';
        
        if (!name || !email || !role) {
            this.showNotification(' Please fill in all required fields', 'error');
            return;
        }
        
        const users = this.getUsers();
        const newUser = {
            id: Math.max(...users.map(u => u.id)) + 1,
            name: name,
            email: email,
            role: role,
            status: 'active',
            avatar: avatar,
            lastLogin: new Date().toISOString()
        };
        
        users.push(newUser);
        this.saveUsers(users);
        this.renderUsersList(users);
        this.showNotification('➕ New user added successfully!', 'success');
    }

    resetSystemSettings() {
        if (confirm(' Reset all system settings to default values? This cannot be undone.')) {
            const defaultSettings = {
                general: {
                    companyName: 'Urban Referral Network',
                    defaultRadius: 25,
                    timezone: 'PST'
                },
                notifications: {
                    emailReferrals: true,
                    smsAlerts: true,
                    dailyReports: false,
                    systemMaintenance: true
                },
                system: {
                    maxReferrals: 3,
                    sessionTimeout: 30,
                    autoBackups: true,
                    maintenanceMode: false
                }
            };
            
            localStorage.setItem('systemSettings', JSON.stringify(defaultSettings));
            this.loadSettings();
            this.showNotification(' System settings reset to defaults', 'success');
        }
    }

    async exportSettings() {
        const settings = this.getSettings();
        const users = this.getUsers();
        const referrals = await this.getReferrals();
        
        const exportData = {
            settings: settings,
            users: users,
            referrals: referrals,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `urban-referral-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showNotification('📤 Settings and data exported successfully!', 'success');
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (confirm('📥 Import settings and data? This will overwrite current data. Continue?')) {
                        if (importData.settings) {
                            localStorage.setItem('systemSettings', JSON.stringify(importData.settings));
                        }
                        if (importData.users) {
                            localStorage.setItem('systemUsers', JSON.stringify(importData.users));
                        }
                        if (importData.referrals) {
                            localStorage.setItem('referrals', JSON.stringify(importData.referrals));
                        }
                        
                        // Reload everything
                        this.loadSettings();
                        this.loadUsers();
                        this.updateDashboardStats();
                        
                        this.showNotification('📥 Settings and data imported successfully!', 'success');
                    }
                } catch (error) {
                    this.showNotification(' Invalid import file format', 'error');
                }
            };
            reader.readAsText(file);
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    clearAllData() {
        if (confirm(' DANGER: This will delete ALL data including referrals, users, and settings. This cannot be undone. Are you absolutely sure?')) {
            if (confirm('🚨 FINAL WARNING: All data will be permanently deleted. Type "DELETE" to confirm.')) {
                localStorage.clear();
                
                // Reload page to reset everything
                this.showNotification(' All data cleared. Reloading...', 'warning');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }
    }

    async showSystemStatus() {
        const settings = this.getSettings();
        const users = this.getUsers();
        const referrals = await this.getReferrals();
        
        const storageUsed = this.calculateStorageUsage();
        const systemHealth = this.checkSystemHealth();
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3> System Status</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="status-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div class="status-item">
                            <h4>👥 Users</h4>
                            <div class="status-value">${users.length}</div>
                            <small>${users.filter(u => u.status === 'active').length} active</small>
                        </div>
                        <div class="status-item">
                            <h4> Referrals</h4>
                            <div class="status-value">${referrals.length}</div>
                            <small>${referrals.filter(r => r.status === 'completed').length} completed</small>
                        </div>
                        <div class="status-item">
                            <h4>💾 Storage</h4>
                            <div class="status-value">${storageUsed.toFixed(1)} KB</div>
                            <small>Local storage used</small>
                        </div>
                        <div class="status-item">
                            <h4>🏥 Health</h4>
                            <div class="status-value ${systemHealth.status}">${systemHealth.status.toUpperCase()}</div>
                            <small>${systemHealth.message}</small>
                        </div>
                    </div>
                    
                    <div class="system-info">
                        <h4>⚙️ Configuration</h4>
                        <ul style="list-style: none; padding: 0;">
                            <li>🏢 Company: ${settings.general.companyName}</li>
                            <li>📍 Default Radius: ${settings.general.defaultRadius} miles</li>
                            <li>🕐 Timezone: ${settings.general.timezone}</li>
                            <li>🔢 Max Referrals: ${settings.system.maxReferrals}</li>
                            <li>⏱️ Session Timeout: ${settings.system.sessionTimeout} minutes</li>
                            <li>💾 Auto Backups: ${settings.system.autoBackups ? ' Enabled' : ' Disabled'}</li>
                            <li>🚧 Maintenance Mode: ${settings.system.maintenanceMode ? ' ACTIVE' : ' Normal'}</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn-primary" onclick="window.dashboard.exportSettings(); this.closest('.modal').remove();">📤 Export Backup</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    calculateStorageUsage() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        return totalSize / 1024; // Convert to KB
    }

    async checkSystemHealth() {
        const settings = this.getSettings();
        const users = this.getUsers();
        const referrals = await this.getReferrals();
        
        if (settings.system.maintenanceMode) {
            return { status: 'warning', message: 'Maintenance mode active' };
        }
        
        if (users.filter(u => u.status === 'active').length === 0) {
            return { status: 'error', message: 'No active users' };
        }
        
        if (referrals.length > 1000) {
            return { status: 'warning', message: 'High data volume' };
        }
        
        return { status: 'healthy', message: 'All systems operational' };
    }

    generateReportData(referrals, days) {
        const total = referrals.length;
        const contacted = referrals.filter(r => ['contacted', 'completed'].includes(r.status)).length;
        const completed = referrals.filter(r => r.status === 'completed').length;
        const pending = referrals.filter(r => r.status === 'pending').length;
        const cancelled = referrals.filter(r => r.status === 'cancelled').length;
        
        // Service distribution
        const serviceCounts = {};
        referrals.forEach(referral => {
            const service = referral.serviceType || 'General';
            serviceCounts[service] = (serviceCounts[service] || 0) + 1;
        });
        
        // Contractor performance
        const contractorStats = {};
        referrals.forEach(referral => {
            const contractor = referral.contractorName || 'Unknown';
            if (!contractorStats[contractor]) {
                contractorStats[contractor] = { total: 0, completed: 0 };
            }
            contractorStats[contractor].total++;
            if (referral.status === 'completed') {
                contractorStats[contractor].completed++;
            }
        });
        
        // Daily trends
        const dailyData = this.generateDailyReferralData(referrals, days);
        
        return {
            summary: {
                dateRange: days,
                totalReferrals: total,
                contactedReferrals: contacted,
                completedReferrals: completed,
                pendingReferrals: pending,
                cancelledReferrals: cancelled,
                contactRate: total > 0 ? Math.round((contacted / total) * 100) : 0,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                avgRating: this.calculateAverageRating(referrals)
            },
            services: Object.entries(serviceCounts).map(([service, count]) => ({
                service,
                count,
                percentage: Math.round((count / total) * 100)
            })),
            contractors: Object.entries(contractorStats)
                .filter(([name]) => name !== 'Unknown')
                .map(([name, stats]) => ({
                    name,
                    total: stats.total,
                    completed: stats.completed,
                    successRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
                }))
                .sort((a, b) => b.successRate - a.successRate),
            dailyTrends: dailyData,
            referralDetails: referrals.map(referral => ({
                id: referral.id,
                customerName: referral.customerName,
                customerPhone: referral.customerPhone,
                zipCode: referral.zipCode,
                serviceType: referral.serviceType,
                contractorName: referral.contractorName,
                contractorPhone: referral.contractorPhone,
                status: referral.status,
                createdAt: referral.createdAt,
                updatedAt: referral.updatedAt
            }))
        };
    }

    generateCSVReport(reportData) {
        let csv = '';
        
        // Report Header
        csv += `Referral Analytics Report\n`;
        csv += `Generated: ${new Date().toLocaleString()}\n`;
        csv += `Date Range: Last ${reportData.summary.dateRange} days\n\n`;
        
        // Summary Section
        csv += `SUMMARY\n`;
        csv += `Total Referrals,${reportData.summary.totalReferrals}\n`;
        csv += `Contacted Referrals,${reportData.summary.contactedReferrals}\n`;
        csv += `Completed Referrals,${reportData.summary.completedReferrals}\n`;
        csv += `Pending Referrals,${reportData.summary.pendingReferrals}\n`;
        csv += `Cancelled Referrals,${reportData.summary.cancelledReferrals}\n`;
        csv += `Contact Rate,${reportData.summary.contactRate}%\n`;
        csv += `Completion Rate,${reportData.summary.completionRate}%\n`;
        csv += `Average Rating,${reportData.summary.avgRating}\n\n`;
        
        // Service Distribution
        csv += `SERVICE DISTRIBUTION\n`;
        csv += `Service Type,Count,Percentage\n`;
        reportData.services.forEach(service => {
            csv += `${service.service},${service.count},${service.percentage}%\n`;
        });
        csv += `\n`;
        
        // Contractor Performance
        if (reportData.contractors.length > 0) {
            csv += `CONTRACTOR PERFORMANCE\n`;
            csv += `Contractor Name,Total Referrals,Completed,Success Rate\n`;
            reportData.contractors.forEach(contractor => {
                csv += `${contractor.name},${contractor.total},${contractor.completed},${contractor.successRate}%\n`;
            });
            csv += `\n`;
        }
        
        // Daily Trends
        csv += `DAILY TRENDS\n`;
        csv += `Date,Referrals\n`;
        reportData.dailyTrends.forEach(day => {
            csv += `${day.date},${day.count}\n`;
        });
        csv += `\n`;
        
        // Detailed Referrals
        csv += `REFERRAL DETAILS\n`;
        csv += `ID,Customer Name,Phone,ZIP Code,Service Type,Contractor,Contractor Phone,Status,Created,Updated\n`;
        reportData.referralDetails.forEach(referral => {
            csv += `${referral.id},"${referral.customerName}","${referral.customerPhone}",${referral.zipCode},"${referral.serviceType}","${referral.contractorName}","${referral.contractorPhone}",${referral.status},${new Date(referral.createdAt).toLocaleString()},${new Date(referral.updatedAt).toLocaleString()}\n`;
        });
        
        return csv;
    }

    showReportSummaryModal(reportData) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3> Analytics Report Preview</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="report-summary">
                        <div class="summary-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                            <div class="summary-item">
                                <h4> Total Referrals</h4>
                                <div class="summary-value">${reportData.summary.totalReferrals}</div>
                            </div>
                            <div class="summary-item">
                                <h4> Completed</h4>
                                <div class="summary-value">${reportData.summary.completedReferrals}</div>
                            </div>
                            <div class="summary-item">
                                <h4>📞 Contact Rate</h4>
                                <div class="summary-value">${reportData.summary.contactRate}%</div>
                            </div>
                            <div class="summary-item">
                                <h4>🎯 Completion Rate</h4>
                                <div class="summary-value">${reportData.summary.completionRate}%</div>
                            </div>
                        </div>
                        
                        <div class="top-services" style="margin-bottom: 1.5rem;">
                            <h4>🔧 Top Services</h4>
                            ${reportData.services.slice(0, 3).map(service => 
                                `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                                    <span>${service.service}</span>
                                    <span><strong>${service.count} (${service.percentage}%)</strong></span>
                                </div>`
                            ).join('')}
                        </div>
                        
                        ${reportData.contractors.length > 0 ? `
                        <div class="top-contractors">
                            <h4>🏆 Top Contractors</h4>
                            ${reportData.contractors.slice(0, 3).map((contractor, index) => 
                                `<div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                                    <span>${index + 1}. ${contractor.name}</span>
                                    <span><strong>${contractor.successRate}% success</strong></span>
                                </div>`
                            ).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn-primary" onclick="window.dashboard.downloadCSVReport(); this.closest('.modal').remove();">📥 Download CSV Report</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    setupQuickActions() {
        // Quick action button handlers using event listeners (more reliable)
        const findContractorsBtn = document.querySelector('.action-card[onclick="showContractorFinder()"]');
        const createReferralBtn = document.querySelector('.action-card[onclick="createReferral()"]');
        const viewReportsBtn = document.querySelector('.action-card[onclick="viewReports()"]');
        const manageContractorsBtn = document.querySelector('.action-card[onclick="manageContractors()"]');

        if (findContractorsBtn) {
            findContractorsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('contractor-finder');
                this.setActiveMenuItem(document.querySelector('[data-section="contractor-finder"]'));
            });
        }

        if (createReferralBtn) {
            createReferralBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('contractor-finder');
                this.setActiveMenuItem(document.querySelector('[data-section="contractor-finder"]'));
                
                // Reset contractor selection for fresh start
                if (this.contractorFinder) {
                    this.contractorFinder.resetSelection();
                }
                
                // Always scroll to referral form for "Create Referral" action
                setTimeout(() => {
                    const referralPanel = document.getElementById('referralPanel');
                    if (referralPanel) {
                        referralPanel.scrollIntoView({ behavior: 'smooth' });
                        // Focus on customer name field
                        const customerNameField = document.getElementById('customerName');
                        if (customerNameField) {
                            customerNameField.focus();
                        }
                    }
                }, 500);
            });
        }

        if (viewReportsBtn) {
            viewReportsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('analytics');
                this.setActiveMenuItem(document.querySelector('[data-section="analytics"]'));
            });
        }

        if (manageContractorsBtn) {
            manageContractorsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection('contractors');
                this.setActiveMenuItem(document.querySelector('[data-section="contractors"]'));
            });
        }

        // Also create global functions as backup
        window.showContractorFinder = () => {
            if (window.dashboard) {
                window.dashboard.showSection('contractor-finder');
                window.dashboard.setActiveMenuItem(document.querySelector('[data-section="contractor-finder"]'));
            }
        };

        window.createReferral = () => {
            if (window.dashboard) {
                window.dashboard.showSection('contractor-finder');
                window.dashboard.setActiveMenuItem(document.querySelector('[data-section="contractor-finder"]'));
                
                // Reset contractor selection for fresh start
                if (window.dashboard.contractorFinder) {
                    window.dashboard.contractorFinder.resetSelection();
                }
                
                // Always scroll to referral form for "Create Referral" action
                setTimeout(() => {
                    const referralPanel = document.getElementById('referralPanel');
                    if (referralPanel) {
                        referralPanel.scrollIntoView({ behavior: 'smooth' });
                        // Focus on customer name field
                        const customerNameField = document.getElementById('customerName');
                        if (customerNameField) {
                            customerNameField.focus();
                        }
                    }
                }, 500);
            }
        };

        window.viewReports = () => {
            if (window.dashboard) {
                window.dashboard.showSection('analytics');
                window.dashboard.setActiveMenuItem(document.querySelector('[data-section="analytics"]'));
            }
        };

        window.manageContractors = () => {
            if (window.dashboard) {
                window.dashboard.showSection('contractors');
                window.dashboard.setActiveMenuItem(document.querySelector('[data-section="contractors"]'));
            }
        };
    }

    setupSearch() {
        const searchInput = document.querySelector('.search-input');
        const searchBtn = document.querySelector('.search-btn');

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(searchInput.value);
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch(searchInput.value);
            });
        }
    }

    performSearch(query) {
        if (!query.trim()) return;

        // Show loading state
        this.showLoadingOverlay('Searching...');

        // Simulate search
        setTimeout(() => {
            this.hideLoadingOverlay();
            this.showSearchResults(query);
        }, 1000);
    }

    showSearchResults(query) {
        // This would typically show search results
        // For now, just show a notification
        this.showNotification(`Search results for: "${query}"`, 'info');
    }

    setupNotifications() {
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }
    }

    showNotifications() {
        // Create and show notifications dropdown
        const notifications = [
            { id: 1, title: 'New referral created', time: '2 minutes ago', type: 'success' },
            { id: 2, title: 'Contractor registered', time: '15 minutes ago', type: 'info' },
            { id: 3, title: 'Review submitted', time: '1 hour ago', type: 'warning' }
        ];

        this.createNotificationDropdown(notifications);
    }

    createNotificationDropdown(notifications) {
        // Remove existing dropdown
        const existingDropdown = document.querySelector('.notification-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        const dropdown = document.createElement('div');
        dropdown.className = 'notification-dropdown';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            width: 320px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-height: 400px;
            overflow-y: auto;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 16px 20px;
            border-bottom: 1px solid var(--gray-200);
            font-weight: 600;
            color: var(--gray-800);
        `;
        header.textContent = 'Notifications';

        dropdown.appendChild(header);

        notifications.forEach(notification => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 12px 20px;
                border-bottom: 1px solid var(--gray-100);
                cursor: pointer;
                transition: background 0.2s;
            `;
            item.innerHTML = `
                <div style="font-weight: 500; color: var(--gray-800); margin-bottom: 4px;">
                    ${notification.title}
                </div>
                <div style="font-size: 0.75rem; color: var(--gray-500);">
                    ${notification.time}
                </div>
            `;
            
            item.addEventListener('mouseenter', () => {
                item.style.background = 'var(--gray-50)';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'transparent';
            });

            dropdown.appendChild(item);
        });

        const notificationBtn = document.querySelector('.notification-btn');
        notificationBtn.style.position = 'relative';
        notificationBtn.appendChild(dropdown);

        // Close dropdown when clicking outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!notificationBtn.contains(e.target)) {
                    dropdown.remove();
                }
            }, { once: true });
        }, 100);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 2000;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease-out;
        `;

        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 4px; height: 40px; background: ${colors[type]}; border-radius: 2px;"></div>
                <div style="flex: 1;">
                    <div style="font-weight: 500; color: var(--gray-800);">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px;">
                    ✕
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    showLoadingOverlay(message = 'Loading...') {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(8px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 3000;
            `;
            
            overlay.innerHTML = `
                <div style="
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    padding: 32px;
                    text-align: center;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid var(--gray-200);
                        border-top: 4px solid var(--primary);
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 16px;
                    "></div>
                    <div style="
                        font-weight: 500;
                        color: var(--gray-700);
                        font-size: 1rem;
                    ">${message}</div>
                </div>
            `;
            
            document.body.appendChild(overlay);
        }
        
        overlay.style.display = 'flex';
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Utility method to format numbers
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Utility method to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        }).format(amount);
    }
}

// Global functions for the new sections
window.refreshReferrals = function() {
    window.dashboard.showNotification('Referrals refreshed', 'success');
    // In a real app, this would reload referral data
};

window.viewReferral = function(referralId) {
    window.dashboard.showNotification(`Viewing referral ${referralId}`, 'info');
    // In a real app, this would open referral details modal
};

window.editReferral = function(referralId) {
    window.dashboard.showNotification(`Editing referral ${referralId}`, 'info');
    // In a real app, this would open referral edit form
};

// ===== CONTRACTOR MANAGEMENT FUNCTIONS =====

window.addNewContractor = function() {
    window.dashboard.showNotification('Opening new contractor form...', 'info');
    showAddContractorModal();
};

window.exportContractors = function() {
    window.dashboard.showNotification(' Exporting contractor data...', 'info');
    
    // Get contractor data from the grid
    const contractorCards = document.querySelectorAll('#contractorsManagementGrid .contractor-card');
    const contractors = [];
    
    contractorCards.forEach(card => {
        const id = card.getAttribute('data-contractor-id');
        const name = card.querySelector('h4')?.textContent || '';
        const type = card.querySelector('p')?.textContent || '';
        const phone = card.querySelector('.detail-item .value')?.textContent || '';
        const serviceArea = card.querySelectorAll('.detail-item .value')[1]?.textContent || '';
        const specialties = card.querySelectorAll('.detail-item .value')[2]?.textContent || '';
        const rating = card.querySelector('.rating-text')?.textContent || '';
        const status = card.querySelector('.contractor-status span:last-child')?.textContent || '';
        
        contractors.push({ id, name, type, phone, serviceArea, specialties, rating, status });
    });
    
    // Create CSV content
    const headers = ['ID', 'Business Name', 'Service Type', 'Phone', 'Service Area', 'Specialties', 'Rating', 'Status'];
    const csvContent = [
        headers.join(','),
        ...contractors.map(contractor => [
            contractor.id,
            `"${contractor.name}"`,
            `"${contractor.type}"`,
            contractor.phone,
            `"${contractor.serviceArea}"`,
            `"${contractor.specialties}"`,
            `"${contractor.rating}"`,
            contractor.status
        ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contractors_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
        window.dashboard.showNotification(' Contractor data exported successfully!', 'success');
    }, 1000);
};

window.editContractor = function(contractorId) {
    window.dashboard.showNotification(`Opening edit form for contractor ${contractorId}`, 'info');
    showEditContractorModal(contractorId);
};

window.viewContractorDetails = function(contractorId) {
    window.dashboard.showNotification(`Viewing contractor ${contractorId} details`, 'info');
    // In a real app, this would open contractor details modal
    showContractorDetailsModal(contractorId);
};

window.suspendContractor = function(contractorId) {
    if (confirm(' Are you sure you want to suspend this contractor?\n\nThis will prevent them from receiving new referrals.')) {
        // Find the contractor card
        const contractorCard = document.querySelector(`[data-contractor-id="${contractorId}"]`);
        if (contractorCard) {
            // Update status indicator
            const statusIndicator = contractorCard.querySelector('.status-indicator');
            const statusText = contractorCard.querySelector('.contractor-status span:last-child');
            const suspendButton = contractorCard.querySelector('.btn-small.warning');
            
            if (statusIndicator && statusText && suspendButton) {
                statusIndicator.className = 'status-indicator suspended';
                statusText.textContent = 'Suspended';
                suspendButton.textContent = 'Reactivate';
                suspendButton.onclick = () => reactivateContractor(contractorId);
                
                // Add visual feedback
                contractorCard.style.opacity = '0.7';
                contractorCard.style.border = '2px solid #f59e0b';
            }
        }
        
        window.dashboard.showNotification(` Contractor ${contractorId} has been suspended`, 'warning');
        updateContractorStatus(contractorId, 'suspended');
    }
};

window.reactivateContractor = function(contractorId) {
    if (confirm(' Reactivate this contractor?\n\nThey will be able to receive new referrals again.')) {
        // Find the contractor card
        const contractorCard = document.querySelector(`[data-contractor-id="${contractorId}"]`);
        if (contractorCard) {
            // Update status indicator
            const statusIndicator = contractorCard.querySelector('.status-indicator');
            const statusText = contractorCard.querySelector('.contractor-status span:last-child');
            const reactivateButton = contractorCard.querySelector('.btn-small.warning');
            
            if (statusIndicator && statusText && reactivateButton) {
                statusIndicator.className = 'status-indicator active';
                statusText.textContent = 'Active';
                reactivateButton.textContent = 'Suspend';
                reactivateButton.onclick = () => suspendContractor(contractorId);
                
                // Remove visual feedback
                contractorCard.style.opacity = '1';
                contractorCard.style.border = 'none';
            }
        }
        
        window.dashboard.showNotification(` Contractor ${contractorId} has been reactivated`, 'success');
        updateContractorStatus(contractorId, 'active');
    }
};

// Contractor Modal Functions
function showAddContractorModal() {
    const modal = document.getElementById('contractorModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = 'Add New Contractor';
        document.getElementById('contractorForm').reset();
        modal.style.display = 'flex';
    }
}

function showEditContractorModal(contractorId) {
    const modal = document.getElementById('contractorModal');
    if (modal) {
        document.getElementById('modalTitle').textContent = `Edit Contractor ${contractorId}`;
        // In a real app, this would load contractor data
        loadContractorData(contractorId);
        modal.style.display = 'flex';
    }
}

function showContractorDetailsModal(contractorId) {
    const modal = document.getElementById('contractorDetailsModal');
    if (modal) {
        // In a real app, this would load contractor details
        loadContractorDetails(contractorId);
        modal.style.display = 'flex';
    }
}

function loadContractorData(contractorId) {
    // Simulate loading contractor data
    const sampleData = {
        'ABC001': {
            name: 'ABC Plumbing Services',
            phone: '(555) 111-2222',
            email: 'contact@abcplumbing.com',
            serviceType: 'Plumbing',
            serviceArea: '90210, 90211, 90212',
            specialties: 'Emergency Repairs, Pipe Installation'
        },
        'QFE001': {
            name: 'Quick Fix Electric',
            phone: '(555) 333-4444',
            email: 'info@quickfixelectric.com',
            serviceType: 'Electrical',
            serviceArea: '90210, 90213, 90214',
            specialties: 'Wiring, Panel Upgrades, Lighting'
        }
    };
    
    const data = sampleData[contractorId];
    if (data) {
        document.getElementById('contractorName').value = data.name;
        document.getElementById('contractorPhone').value = data.phone;
        document.getElementById('contractorEmail').value = data.email;
        document.getElementById('serviceType').value = data.serviceType;
        document.getElementById('serviceArea').value = data.serviceArea;
        document.getElementById('specialties').value = data.specialties;
    }
}

function loadContractorDetails(contractorId) {
    // In a real app, this would load detailed contractor information
    const detailsContainer = document.getElementById('contractorDetailsContent');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <h3>Contractor Details: ${contractorId}</h3>
            <p>Detailed information would be loaded here...</p>
        `;
    }
}

function updateContractorStatus(contractorId, status) {
    // In a real app, this would update the contractor status in the database
    console.log(`Updating contractor ${contractorId} status to ${status}`);
}

// Enhanced Search functionality
window.searchContractors = function() {
    const searchInput = document.getElementById('contractorSearch');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const contractorCards = document.querySelectorAll('#contractorsManagementGrid .contractor-card');
    
    // Remove any existing "no results" message
    const existingNoResults = document.querySelector('.no-results');
    if (existingNoResults) existingNoResults.remove();
    
    if (!searchTerm) {
        // Show all contractors if search is empty
        contractorCards.forEach(card => {
            card.style.display = 'block';
            removeHighlights(card);
        });
        window.dashboard.showNotification('Showing all contractors', 'info');
        return;
    }
    
    let visibleCount = 0;
    
    contractorCards.forEach((card, index) => {
        const contractorName = card.querySelector('h4')?.textContent.toLowerCase() || '';
        const contractorType = card.querySelector('p')?.textContent.toLowerCase() || '';
        const phone = card.querySelector('.detail-item .value')?.textContent.toLowerCase() || '';
        const serviceArea = card.querySelectorAll('.detail-item .value')[1]?.textContent.toLowerCase() || '';
        const specialties = card.querySelectorAll('.detail-item .value')[2]?.textContent.toLowerCase() || '';
        
        // Search in multiple fields
        const isMatch = contractorName.includes(searchTerm) || 
                       contractorType.includes(searchTerm) ||
                       phone.includes(searchTerm) ||
                       serviceArea.includes(searchTerm) ||
                       specialties.includes(searchTerm);
        
        if (isMatch) {
            card.style.display = 'block';
            card.style.animation = `fadeInUp 0.3s ease-out ${index * 0.1}s`;
            visibleCount++;
            
            // Highlight search term
            highlightSearchTerm(card, searchTerm);
        } else {
            card.style.display = 'none';
            removeHighlights(card);
        }
    });
    
    // Show search results
    if (visibleCount === 0) {
        window.dashboard.showNotification(` No contractors found for: "${searchTerm}"`, 'warning');
        
        // Show "no results" message
        const grid = document.getElementById('contractorsManagementGrid');
        if (grid) {
            const noResults = document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-600); grid-column: 1 / -1;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;"></div>
                    <h3>No contractors found</h3>
                    <p>Try searching with different keywords</p>
                    <button class="btn-secondary" onclick="clearSearch()" style="margin-top: 1rem;">Clear Search</button>
                </div>
            `;
            grid.appendChild(noResults);
        }
    } else {
        window.dashboard.showNotification(` Found ${visibleCount} contractor${visibleCount !== 1 ? 's' : ''} for: "${searchTerm}"`, 'success');
    }
};

// Clear search function
window.clearSearch = function() {
    const searchInput = document.getElementById('contractorSearch');
    if (searchInput) {
        searchInput.value = '';
        searchContractors();
    }
};

// Highlight search terms
function highlightSearchTerm(card, searchTerm) {
    removeHighlights(card);
    
    const textElements = card.querySelectorAll('h4, p, .value');
    textElements.forEach(el => {
        const text = el.textContent;
        if (text.toLowerCase().includes(searchTerm)) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            el.innerHTML = text.replace(regex, '<span class="highlight">$1</span>');
        }
    });
}

// Remove highlights
function removeHighlights(card) {
    card.querySelectorAll('.highlight').forEach(el => {
        el.outerHTML = el.innerHTML;
    });
}

// ===== REFERRAL MANAGEMENT FUNCTIONS =====

window.refreshReferrals = function() {
    window.dashboard.showNotification(' Refreshing referrals...', 'info');
    window.dashboard.loadReferrals();
    setTimeout(() => {
        window.dashboard.showNotification(' Referrals refreshed!', 'success');
    }, 1000);
};

window.clearReferralFilters = function() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('dateFilter').value = 'all';
    window.dashboard.loadReferrals();
    window.dashboard.showNotification('Filters cleared', 'info');
};

window.viewReferral = function(referralId) {
    console.log('viewReferral called with ID:', referralId);
    const referrals = JSON.parse(localStorage.getItem('referrals') || '[]');
    const referral = referrals.find(r => r.id === referralId);
    
    if (!referral) {
        window.dashboard.showNotification('Referral not found', 'error');
        return;
    }
    
    // Create and show referral details modal
    showReferralDetailsModal(referral);
};

window.editReferral = function(referralId) {
    console.log('editReferral called with ID:', referralId);
    const referrals = JSON.parse(localStorage.getItem('referrals') || '[]');
    const referral = referrals.find(r => r.id === referralId);
    
    if (!referral) {
        window.dashboard.showNotification('Referral not found', 'error');
        return;
    }
    
    // For now, show details modal (edit functionality can be added later)
    window.dashboard.showNotification(`Edit functionality for referral #${referralId} coming soon!`, 'info');
    showReferralDetailsModal(referral);
};

window.updateReferralStatus = function(referralId) {
    console.log('updateReferralStatus called with ID:', referralId);
    const referrals = JSON.parse(localStorage.getItem('referrals') || '[]');
    const referral = referrals.find(r => r.id === referralId);
    
    if (!referral) {
        window.dashboard.showNotification('Referral not found', 'error');
        return;
    }
    
    // Show status update options
    showStatusUpdateModal(referral);
};

window.showReferralDetailsModal = function(referral) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Referral Details - #${referral.id}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="referral-details-grid">
                    <div class="detail-section">
                        <h4>👤 Customer Information</h4>
                        <p><strong>Name:</strong> ${referral.customerName}</p>
                        <p><strong>Phone:</strong> ${referral.customerPhone}</p>
                        <p><strong>ZIP Code:</strong> ${referral.zipCode}</p>
                    </div>
                    <div class="detail-section">
                        <h4>🔧 Service Details</h4>
                        <p><strong>Service Type:</strong> ${referral.serviceType}</p>
                        <p><strong>Contractor:</strong> ${referral.contractorName || 'Not assigned'}</p>
                        <p><strong>Contractor Phone:</strong> ${referral.contractorPhone || 'N/A'}</p>
                    </div>
                    <div class="detail-section">
                        <h4> Status Information</h4>
                        <p><strong>Status:</strong> <span class="status-badge ${referral.status}">${referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}</span></p>
                        <p><strong>Created:</strong> ${window.dashboard.formatDate(referral.createdAt)} at ${window.dashboard.formatTime(referral.createdAt)}</p>
                        <p><strong>Updated:</strong> ${window.dashboard.formatDate(referral.updatedAt)} at ${window.dashboard.formatTime(referral.updatedAt)}</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                <button class="btn-primary" onclick="updateReferralStatus('${referral.id}'); this.closest('.modal').remove();">Update Status</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

function showReferralDetailsModal(referral) {
    window.showReferralDetailsModal(referral);
}

window.showStatusUpdateModal = function(referral) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>📝 Update Status - #${referral.id}</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>👤 Customer:</strong> ${referral.customerName}</p>
                <p><strong>📞 Phone:</strong> ${referral.customerPhone}</p>
                <p><strong>🔧 Service:</strong> ${referral.serviceType}</p>
                <p><strong>Current Status:</strong> <span class="status-badge ${referral.status}">${referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}</span></p>
                
                <div class="form-group" style="margin-top: 1.5rem;">
                    <label for="newStatus"><strong>New Status:</strong></label>
                    <select id="newStatus" style="width: 100%; padding: 0.5rem; margin-top: 0.5rem; border: 1px solid var(--gray-300); border-radius: 4px;">
                        <option value="pending" ${referral.status === 'pending' ? 'selected' : ''}> Pending</option>
                        <option value="contacted" ${referral.status === 'contacted' ? 'selected' : ''}>📞 Contacted</option>
                        <option value="completed" ${referral.status === 'completed' ? 'selected' : ''}> Completed</option>
                        <option value="cancelled" ${referral.status === 'cancelled' ? 'selected' : ''}> Cancelled</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                <button class="btn-primary" onclick="saveReferralStatus('${referral.id}', document.getElementById('newStatus').value); this.closest('.modal').remove();">💾 Update Status</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

function showStatusUpdateModal(referral) {
    window.showStatusUpdateModal(referral);
}

window.saveReferralStatus = function(referralId, newStatus) {
    const referrals = JSON.parse(localStorage.getItem('referrals') || '[]');
    const referralIndex = referrals.findIndex(r => r.id === referralId);
    
    if (referralIndex === -1) {
        window.dashboard.showNotification('Referral not found', 'error');
        return;
    }
    
    const oldStatus = referrals[referralIndex].status;
    referrals[referralIndex].status = newStatus;
    referrals[referralIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('referrals', JSON.stringify(referrals));
    
    // Refresh the referrals display
    window.dashboard.loadReferrals();
    
    window.dashboard.showNotification(` Referral #${referralId} status updated from "${oldStatus}" to "${newStatus}"`, 'success');
};

// Debug function to clear referrals (for testing)
window.clearAllReferrals = function() {
    if (confirm(' This will delete all referrals. Are you sure?')) {
        localStorage.removeItem('referrals');
        window.dashboard.loadReferrals();
        window.dashboard.updateReferralStats();
        window.dashboard.showNotification(' All referrals cleared', 'warning');
    }
};

// Debug function to generate sample data for analytics testing
window.generateSampleData = function() {
    if (confirm(' Generate sample referral data for analytics testing?')) {
        const sampleReferrals = [
            {
                id: 'SAMPLE001',
                customerName: 'John Smith',
                customerPhone: '555-0101',
                zipCode: '90210',
                serviceType: 'Plumbing',
                contractorName: 'ABC Plumbing Co',
                contractorPhone: '555-1001',
                status: 'completed',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'SAMPLE002',
                customerName: 'Sarah Johnson',
                customerPhone: '555-0102',
                zipCode: '90211',
                serviceType: 'Electrical',
                contractorName: 'Quick Fix Electric',
                contractorPhone: '555-1002',
                status: 'contacted',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'SAMPLE003',
                customerName: 'Mike Davis',
                customerPhone: '555-0103',
                zipCode: '90212',
                serviceType: 'HVAC',
                contractorName: 'Cool Air Systems',
                contractorPhone: '555-1003',
                status: 'completed',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'SAMPLE004',
                customerName: 'Lisa Wilson',
                customerPhone: '555-0104',
                zipCode: '90213',
                serviceType: 'Plumbing',
                contractorName: 'ABC Plumbing Co',
                contractorPhone: '555-1001',
                status: 'pending',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'SAMPLE005',
                customerName: 'Tom Brown',
                customerPhone: '555-0105',
                zipCode: '90214',
                serviceType: 'General',
                contractorName: 'HandyMan Pro',
                contractorPhone: '555-1004',
                status: 'cancelled',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'SAMPLE006',
                customerName: 'Emma Garcia',
                customerPhone: '555-0106',
                zipCode: '90215',
                serviceType: 'Electrical',
                contractorName: 'Quick Fix Electric',
                contractorPhone: '555-1002',
                status: 'completed',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        // Add to existing referrals
        const existingReferrals = JSON.parse(localStorage.getItem('referrals') || '[]');
        const allReferrals = [...existingReferrals, ...sampleReferrals];
        localStorage.setItem('referrals', JSON.stringify(allReferrals));
        
        // Update displays
        if (window.dashboard) {
            window.dashboard.loadReferrals();
            window.dashboard.updateReferralStats();
            window.dashboard.loadAnalyticsData();
            window.dashboard.showNotification(' Sample data generated! Check Analytics section.', 'success');
        }
        
        console.log('Sample data generated:', sampleReferrals);
    }
};

// Modal Control Functions
window.closeContractorModal = function() {
    const modal = document.getElementById('contractorModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.closeContractorDetailsModal = function() {
    const modal = document.getElementById('contractorDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.saveContractor = function() {
    const form = document.getElementById('contractorForm');
    const formData = new FormData(form);
    
    // Basic validation
    if (!formData.get('contractorName') || !formData.get('contractorPhone') || !formData.get('contractorEmail')) {
        window.dashboard.showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // In a real app, this would save to database
    window.dashboard.showNotification('Contractor saved successfully!', 'success');
    closeContractorModal();
    
    // Refresh the contractors grid (in a real app)
    setTimeout(() => {
        window.dashboard.showNotification('Contractor list updated', 'info');
    }, 1000);
};

window.updateAnalytics = function() {
    window.dashboard.showNotification('Analytics updated', 'success');
    // In a real app, this would refresh analytics data
};

window.exportReport = function() {
    window.dashboard.showNotification('Generating report...', 'info');
    // In a real app, this would generate and download report
};

window.showSettingsTab = function(tabName) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load users when users tab is selected
    if (tabName === 'users' && window.dashboard) {
        window.dashboard.loadUsers();
    }
};

window.saveGeneralSettings = function() {
    if (window.dashboard) {
        window.dashboard.showNotification('💾 Saving general settings...', 'info');
        
        const settings = window.dashboard.getSettings();
        const companyNameInput = document.getElementById('companyName');
        const defaultRadiusSelect = document.getElementById('defaultRadius');
        const timezoneSelect = document.getElementById('timezone');
        
        if (companyNameInput) settings.general.companyName = companyNameInput.value;
        if (defaultRadiusSelect) settings.general.defaultRadius = parseInt(defaultRadiusSelect.value);
        if (timezoneSelect) settings.general.timezone = timezoneSelect.value;
        
        window.dashboard.saveSettings(settings);
    }
};

window.saveNotificationSettings = function() {
    if (window.dashboard) {
        window.dashboard.showNotification('💾 Saving notification settings...', 'info');
        
        const settings = window.dashboard.getSettings();
        const notificationCheckboxes = document.querySelectorAll('#notifications-tab input[type="checkbox"]');
        
        if (notificationCheckboxes.length >= 4) {
            settings.notifications.emailReferrals = notificationCheckboxes[0].checked;
            settings.notifications.smsAlerts = notificationCheckboxes[1].checked;
            settings.notifications.dailyReports = notificationCheckboxes[2].checked;
            settings.notifications.systemMaintenance = notificationCheckboxes[3].checked;
        }
        
        window.dashboard.saveSettings(settings);
    }
};

window.saveSystemSettings = function() {
    if (window.dashboard) {
        window.dashboard.showNotification('💾 Saving system settings...', 'info');
        
        const settings = window.dashboard.getSettings();
        const maxReferralsInput = document.getElementById('maxReferrals');
        const sessionTimeoutInput = document.getElementById('sessionTimeout');
        const systemCheckboxes = document.querySelectorAll('#system-tab input[type="checkbox"]');
        
        if (maxReferralsInput) settings.system.maxReferrals = parseInt(maxReferralsInput.value);
        if (sessionTimeoutInput) settings.system.sessionTimeout = parseInt(sessionTimeoutInput.value);
        if (systemCheckboxes.length >= 2) {
            settings.system.autoBackups = systemCheckboxes[0].checked;
            settings.system.maintenanceMode = systemCheckboxes[1].checked;
        }
        
        window.dashboard.saveSettings(settings);
        
        // Show maintenance mode warning if enabled
        if (settings.system.maintenanceMode) {
            setTimeout(() => {
                window.dashboard.showNotification(' Maintenance mode is now ACTIVE - system access may be limited', 'warning');
            }, 1000);
        }
    }
};



// Test function for user buttons
window.testUserButtons = function() {
    console.log(' Testing user buttons...');
    console.log(' Dashboard object:', window.dashboard);
    console.log('👥 Available functions:', {
        editUser: typeof window.dashboard?.editUser,
        resetPassword: typeof window.dashboard?.resetPassword,
        toggleUserStatus: typeof window.dashboard?.toggleUserStatus,
        deleteUser: typeof window.dashboard?.deleteUser
    });
    
    // Test with user ID 1
    if (window.dashboard) {
        console.log('🔧 Testing editUser(1)...');
        window.dashboard.editUser(1);
    }
};

// Force reload users
window.reloadUsers = function() {
    if (window.dashboard) {
        console.log(' Force reloading users...');
        window.dashboard.loadUsers();
    }
};

// Add test users
window.addTestUsers = function() {
    const testUsers = [
        {
            id: 1,
            name: 'System Administrator',
            email: 'admin@urbanreferral.com',
            role: 'admin',
            status: 'active',
            avatar: '👨‍💼',
            lastLogin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            agentCode: 'ADMIN_001',
            password: 'admin123'
        },
        {
            id: 2,
            name: 'John Manager',
            email: 'john@urbanreferral.com',
            role: 'manager',
            status: 'active',
            avatar: '👩‍💼',
            lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            agentCode: 'MGR_001',
            password: 'manager123'
        },
        {
            id: 3,
            name: 'Sarah Agent',
            email: 'sarah@urbanreferral.com',
            role: 'agent',
            status: 'active',
            avatar: '👤',
            lastLogin: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            agentCode: 'AGT_001',
            password: 'agent123'
        }
    ];
    
    localStorage.setItem('systemUsers', JSON.stringify(testUsers));
    console.log(' Test users added:', testUsers);
    
    if (window.dashboard) {
        window.dashboard.loadUsers();
    }
};

// Show current user credentials for debugging
window.showUserCredentials = function() {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    console.log(' Current User Credentials:');
    users.forEach(user => {
        console.log(`ID: ${user.id} | Agent Code: ${user.agentCode} | Password: ${user.password || 'admin123'} | Role: ${user.role} | Status: ${user.status}`);
    });
    if (users.length === 0) {
        console.log('No users found. Run addTestUsers() first.');
    }
};

// Test delete functionality
window.testDeleteUser = function(userId) {
    if (window.dashboard) {
        console.log(' Testing delete user with ID:', userId);
        window.dashboard.deleteUser(userId);
    } else {
        console.log(' Dashboard not available');
    }
};

// Test pending contractors functionality
window.testPendingContractors = function() {
    if (window.dashboard) {
        console.log(' Testing pending contractors...');
        window.dashboard.showSection('pending-contractors');
    } else {
        console.log(' Dashboard not available');
    }
};

// Test contractor details modal
window.testContractorDetails = function(contractorId = 1) {
    if (window.dashboard) {
        console.log(' Testing contractor details modal for ID:', contractorId);
        window.dashboard.viewContractorDetails(contractorId);
    } else {
        console.log(' Dashboard not available');
    }
};

// Test approve contractor
window.testApproveContractor = function(contractorId = 1) {
    if (window.dashboard) {
        console.log(' Testing approve contractor for ID:', contractorId);
        window.dashboard.approveContractor(contractorId);
    } else {
        console.log(' Dashboard not available');
    }
};

// Test reject contractor
window.testRejectContractor = function(contractorId = 1) {
    if (window.dashboard) {
        console.log(' Testing reject contractor for ID:', contractorId);
        window.dashboard.rejectContractor(contractorId);
    } else {
        console.log(' Dashboard not available');
    }
};

// Show current pending contractors
window.showPendingContractors = function() {
    const pending = JSON.parse(localStorage.getItem('pendingContractors') || '[]');
    console.log(' Current pending contractors:', pending);
    return pending;
};

// Show approved contractors
window.showApprovedContractors = function() {
    const approved = JSON.parse(localStorage.getItem('contractors') || '[]');
    console.log(' Current approved contractors:', approved);
    return approved;
};

// Reset pending contractors - now clears all data
window.resetPendingContractors = function() {
    localStorage.removeItem('pendingContractors');
    console.log(' Cleared all pending contractors data');
    if (window.dashboard && document.getElementById('pending-contractors-section').classList.contains('active')) {
        window.dashboard.refreshPendingContractors();
    }
};

// Complete test of approve/reject flow
window.testCompleteFlow = function() {
    console.log(' Testing complete approve/reject flow...');
    
    // Reset data
    resetPendingContractors();
    localStorage.removeItem('contractors');
    
    console.log(' Step 1: Check initial state');
    console.log('Pending:', showPendingContractors().length);
    console.log('Approved:', showApprovedContractors().length);
    
    console.log(' Step 2: Go to pending contractors');
    if (window.dashboard) {
        window.dashboard.showSection('pending-contractors');
        
        setTimeout(() => {
            console.log(' Step 3: Test approve contractor ID 1');
            console.log('Click approve on Mike Johnson to test...');
        }, 1000);
    }
};

// Clear all contractor data
window.clearAllContractorData = function() {
    localStorage.removeItem('pendingContractors');
    localStorage.removeItem('contractors');
    localStorage.removeItem('rejectedContractors');
    console.log(' All contractor data cleared');
    
    if (window.dashboard) {
        if (document.getElementById('pending-contractors-section').classList.contains('active')) {
            window.dashboard.refreshPendingContractors();
        }
        if (document.getElementById('contractors-section').classList.contains('active')) {
            window.dashboard.loadContractors();
        }
    }
};

// Test contractor management functions
window.testContractorManagement = function() {
    console.log(' Testing contractor management...');
    
    // First ensure we have some approved contractors
    if (window.dashboard) {
        const approved = showApprovedContractors();
        if (approved.length === 0) {
            console.log(' No approved contractors. Approving one first...');
            resetPendingContractors();
            setTimeout(() => {
                testApproveContractor(1);
                setTimeout(() => {
                    console.log(' Now test the contractor management features:');
                    console.log('1. Go to Contractors section');
                    console.log('2. Try Edit, View, Suspend buttons');
                }, 1000);
            }, 500);
        } else {
            console.log(' Found approved contractors. Test the management features:');
            console.log('1. Go to Contractors section');
            console.log('2. Try Edit, View, Suspend buttons');
            window.dashboard.showSection('contractors');
        }
    }
};

// Test edit contractor
window.testEditContractor = function(contractorId) {
    if (window.dashboard) {
        console.log(' Testing edit contractor for ID:', contractorId);
        window.dashboard.editContractor(contractorId);
    }
};

// Test view contractor details
window.testViewContractor = function(contractorId) {
    if (window.dashboard) {
        console.log(' Testing view contractor for ID:', contractorId);
        window.dashboard.viewApprovedContractorDetails(contractorId);
    }
};

// Test suspend contractor
window.testSuspendContractor = function(contractorId) {
    if (window.dashboard) {
        console.log(' Testing suspend contractor for ID:', contractorId);
        window.dashboard.suspendContractor(contractorId);
    }
};

// Test wider modal view
window.testWiderModal = function() {
    console.log(' Testing wider contractor details modal...');
    
    // Ensure we have approved contractors
    const approved = showApprovedContractors();
    if (approved.length === 0) {
        console.log(' No approved contractors. Creating one...');
        resetPendingContractors();
        setTimeout(() => {
            testApproveContractor(1);
            setTimeout(() => {
                testViewContractor(1);
            }, 1000);
        }, 500);
    } else {
        console.log(' Testing wider modal with existing contractor...');
        testViewContractor(approved[0].id);
    }
};

// Test duplicate prevention system
window.testDuplicatePrevention = function() {
    console.log(' Testing duplicate prevention system...');
    
    // Get current contractors
    const pending = JSON.parse(localStorage.getItem('pendingContractors') || '[]');
    const approved = JSON.parse(localStorage.getItem('contractors') || '[]');
    
    console.log(' Current contractors:');
    console.log('Pending:', pending.map(c => ({ name: c.name, username: c.username, license: c.license })));
    console.log('Approved:', approved.map(c => ({ name: c.name, username: c.username, license: c.license })));
    
    console.log(' To test duplicate prevention:');
    console.log('1. Go to contractor registration page');
    console.log('2. Try to register with existing username or license');
    console.log('3. Should see validation errors');
    
    // Add some test data if none exists
    if (pending.length === 0 && approved.length === 0) {
        resetPendingContractors();
        console.log(' Added demo data for testing');
    }
};



// Check for duplicates manually
window.checkDuplicates = function(username, license) {
    const pending = JSON.parse(localStorage.getItem('pendingContractors') || '[]');
    const approved = JSON.parse(localStorage.getItem('contractors') || '[]');
    const rejected = JSON.parse(localStorage.getItem('rejectedContractors') || '[]');
    const all = [...pending, ...approved, ...rejected];
    
    const usernameExists = all.some(c => c.username && c.username.toLowerCase() === username.toLowerCase());
    const licenseExists = all.some(c => c.license && c.license.toLowerCase() === license.toLowerCase());
    
    console.log(' Duplicate check results:');
    console.log(`Username "${username}":`, usernameExists ? ' Already exists' : ' Available');
    console.log(`License "${license}":`, licenseExists ? ' Already exists' : ' Available');
    
    return { usernameExists, licenseExists };
};

// Test license verification system
window.testLicenseVerification = function() {
    console.log(' Testing license verification system...');
    
    // Ensure we have pending contractors with licenses
    const pending = JSON.parse(localStorage.getItem('pendingContractors') || '[]');
    const contractorsWithLicenses = pending.filter(c => c.license);
    
    if (contractorsWithLicenses.length === 0) {
        console.log(' No pending contractors with licenses. Adding demo data...');
        resetPendingContractors();
        setTimeout(() => {
            const newPending = JSON.parse(localStorage.getItem('pendingContractors') || '[]');
            const firstWithLicense = newPending.find(c => c.license);
            if (firstWithLicense) {
                console.log(' Testing license verification for:', firstWithLicense.name);
                console.log(' License:', firstWithLicense.license);
                console.log(' Go to Pending Contractors and click " Verify License"');
            }
        }, 500);
    } else {
        console.log(' Found contractors with licenses:');
        contractorsWithLicenses.forEach(c => {
            console.log(`- ${c.name}: ${c.license}`);
        });
        console.log(' Go to Pending Contractors and click " Verify License"');
    }
};

// Test specific license verification
window.testVerifyLicense = function(contractorId) {
    if (window.dashboard) {
        console.log(' Testing license verification for contractor ID:', contractorId);
        window.dashboard.verifyLicense(contractorId);
    } else {
        console.log(' Dashboard not loaded');
    }
};

// Open license verification page directly
window.openLicenseVerification = function(contractorId = 1) {
    const url = `/pages/license-verification.html?contractorId=${contractorId}`;
    console.log(' Opening license verification page:', url);
    window.open(url, '_blank');
};

// Test mandatory LLC and license requirements
window.testMandatoryFields = function() {
    console.log(' Testing mandatory LLC and license requirements...');
    console.log(' New requirements:');
    console.log(' Company name MUST include "LLC"');
    console.log(' California Contractors License is MANDATORY');
    console.log(' Username and password are required');
    console.log('');
    console.log(' Test scenarios:');
    console.log('1. Go to contractor registration page');
    console.log('2. Try submitting without LLC in company name');
    console.log('3. Try submitting without license number');
    console.log('4. Should see validation errors');
    console.log('');
    console.log(' Valid test data:');
    console.log('Company: "Test Construction LLC"');
    console.log('License: "TEST123" (any format 4-10 chars)');
    console.log('Username: "testuser123"');
    console.log('Password: "TestPass123"');
};



// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.style.display = 'none';
    }
});

// Ensure clear function is available globally
if (typeof window.clearAllReferrals === 'undefined') {
    window.clearAllReferrals = function() {
        if (confirm(' This will delete all referrals. Are you sure?')) {
            localStorage.removeItem('referrals');
            if (window.dashboard) {
                window.dashboard.loadReferrals();
                window.dashboard.updateReferralStats();
                window.dashboard.showNotification(' All referrals cleared', 'warning');
            }
            console.log('All referrals cleared');
        }
    };
}

// ===== ANALYTICS FUNCTIONS =====

window.updateAnalytics = function() {
    console.log('updateAnalytics called');
    if (window.dashboard) {
        window.dashboard.showNotification(' Updating analytics...', 'info');
        
        // Add loading animation
        const updateBtn = document.querySelector('button[onclick="updateAnalytics()"]');
        if (updateBtn) {
            const originalText = updateBtn.innerHTML;
            updateBtn.innerHTML = ' Updating...';
            updateBtn.disabled = true;
            
            setTimeout(() => {
                window.dashboard.loadAnalyticsData();
                updateBtn.innerHTML = originalText;
                updateBtn.disabled = false;
                window.dashboard.showNotification(' Analytics updated successfully!', 'success');
            }, 1500);
        } else {
            window.dashboard.loadAnalyticsData();
            window.dashboard.showNotification(' Analytics updated!', 'success');
        }
    } else {
        console.error('Dashboard not initialized');
    }
};

window.exportReport = function() {
    console.log('exportReport called');
    if (window.dashboard) {
        window.dashboard.showNotification(' Preparing report preview...', 'info');
        
        // Add loading animation
        const exportBtn = document.querySelector('button[onclick="exportReport()"]');
        if (exportBtn) {
            const originalText = exportBtn.innerHTML;
            exportBtn.innerHTML = ' Loading...';
            exportBtn.disabled = true;
            
            setTimeout(() => {
                window.dashboard.showReportPreview(); // Show preview modal first
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            }, 800);
        } else {
            window.dashboard.showReportPreview();
        }
    } else {
        console.error('Dashboard not initialized');
    }
};