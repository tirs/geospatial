/**
 * Contractor Dashboard JavaScript
 * Urban Referral Network
 */

class ContractorDashboard {
    constructor() {
        this.apiBase = '/api';
        this.contractorId = null;
        this.contractorData = null;
        this.referrals = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.itemsPerPage = 10;
        
        this.init();
    }
    
    async init() {
        // Check authentication first
        const isAuthenticated = await this.checkAuthentication();
        if (!isAuthenticated) {
            return;
        }
        
        // Get contractor ID from localStorage
        this.contractorId = this.getContractorId();
        
        if (!this.contractorId) {
            alert('Session error. Please login again.');
            this.redirectToLogin();
            return;
        }
        
        // Initialize UI components
        this.initializeUI();
        
        // Load contractor data
        await this.loadContractorData();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    async checkAuthentication() {
        const sessionToken = localStorage.getItem('sessionToken');
        const userType = localStorage.getItem('userType');
        
        if (!sessionToken || userType !== 'contractor') {
            this.redirectToLogin();
            return false;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/Auth/contractor-validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            const result = await response.json();
            
            if (result.result === 'VALID') {
                // Update contractor data from session
                this.contractorData = {
                    contractorId: result.contractorId,
                    companyName: result.companyName,
                    contactName: result.contactName
                };
                return true;
            } else {
                throw new Error('Invalid session');
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            localStorage.clear();
            this.redirectToLogin();
            return false;
        }
    }
    
    getContractorId() {
        return localStorage.getItem('contractorId');
    }
    
    redirectToLogin() {
        window.location.href = '/unified-login.html';
    }
    
    initializeUI() {
        // Initialize sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
        
        // Initialize navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
        
        // Initialize notification bell
        const notificationBell = document.querySelector('.notification-bell');
        const notificationCenter = document.getElementById('notificationCenter');
        const overlay = document.getElementById('overlay');
        const closeNotifications = document.getElementById('closeNotifications');
        
        if (notificationBell && notificationCenter && overlay && closeNotifications) {
            notificationBell.addEventListener('click', () => {
                notificationCenter.classList.add('open');
                overlay.style.display = 'block';
            });
            
            closeNotifications.addEventListener('click', () => {
                notificationCenter.classList.remove('open');
                overlay.style.display = 'none';
            });
            
            overlay.addEventListener('click', () => {
                notificationCenter.classList.remove('open');
                overlay.style.display = 'none';
                
                // Also close any open modals
                const modals = document.querySelectorAll('.modal');
                modals.forEach(modal => {
                    modal.style.display = 'none';
                });
            });
        }
        
        // Initialize settings navigation
        const settingsNavItems = document.querySelectorAll('.settings-nav-item');
        settingsNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const settingsSection = item.getAttribute('data-settings');
                this.navigateToSettingsSection(settingsSection);
            });
        });
        
        // Initialize profile edit modal
        const editProfileBtn = document.getElementById('editProfileBtn');
        const profileEditModal = document.getElementById('profileEditModal');
        const closeProfileModal = document.getElementById('closeProfileModal');
        const cancelProfileEdit = document.getElementById('cancelProfileEdit');
        
        if (editProfileBtn && profileEditModal && closeProfileModal && cancelProfileEdit) {
            editProfileBtn.addEventListener('click', () => {
                profileEditModal.style.display = 'block';
                overlay.style.display = 'block';
                this.populateProfileEditForm();
            });
            
            closeProfileModal.addEventListener('click', () => {
                profileEditModal.style.display = 'none';
                overlay.style.display = 'none';
            });
            
            cancelProfileEdit.addEventListener('click', () => {
                profileEditModal.style.display = 'none';
                overlay.style.display = 'none';
            });
        }
        
        // Initialize quick action buttons
        const updateProfileBtn = document.getElementById('updateProfileBtn');
        if (updateProfileBtn) {
            updateProfileBtn.addEventListener('click', () => {
                this.navigateToSection('profile');
                setTimeout(() => {
                    editProfileBtn.click();
                }, 300);
            });
        }
        
        const updateServicesBtn = document.getElementById('updateServicesBtn');
        if (updateServicesBtn) {
            updateServicesBtn.addEventListener('click', () => {
                this.navigateToSection('services');
            });
        }
        
        const updateAvailabilityBtn = document.getElementById('updateAvailabilityBtn');
        if (updateAvailabilityBtn) {
            updateAvailabilityBtn.addEventListener('click', () => {
                this.navigateToSection('services');
                // Scroll to availability section
                setTimeout(() => {
                    const availabilitySection = document.querySelector('.service-availability');
                    if (availabilitySection) {
                        availabilitySection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 300);
            });
        }
        
        const contactSupportBtn = document.getElementById('contactSupportBtn');
        if (contactSupportBtn) {
            contactSupportBtn.addEventListener('click', () => {
                window.location.href = 'tel:18007777777';
            });
        }
        
        // Initialize logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.logout();
            });
        }
        
        // Initialize form submissions
        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileChanges();
            });
        }
        
        const accountSettingsForm = document.getElementById('accountSettingsForm');
        if (accountSettingsForm) {
            accountSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveAccountSettings();
            });
        }
        
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }
        
        // Initialize referral filters
        const referralSearch = document.getElementById('referralSearch');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        
        if (referralSearch && statusFilter && dateFilter) {
            referralSearch.addEventListener('input', () => {
                this.filterReferrals();
            });
            
            statusFilter.addEventListener('change', () => {
                this.filterReferrals();
            });
            
            dateFilter.addEventListener('change', () => {
                this.filterReferrals();
            });
        }
        
        // Initialize pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (prevPage && nextPage) {
            prevPage.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderReferralsTable();
                    this.updatePagination();
                }
            });
            
            nextPage.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.renderReferralsTable();
                    this.updatePagination();
                }
            });
        }
        
        // Initialize performance chart filters
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                timeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const period = btn.getAttribute('data-period');
                this.updatePerformanceChart(period);
            });
        });
        
        // Initialize date range buttons
        const dateRangeButtons = document.querySelectorAll('.date-range-btn');
        dateRangeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                dateRangeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const range = btn.getAttribute('data-range');
                this.updatePerformanceData(range);
            });
        });
        
        // Initialize save services button
        const saveServicesBtn = document.getElementById('saveServicesBtn');
        if (saveServicesBtn) {
            saveServicesBtn.addEventListener('click', () => {
                this.saveServiceChanges();
            });
        }
        
        // Initialize notification settings save button
        const saveNotificationSettings = document.getElementById('saveNotificationSettings');
        if (saveNotificationSettings) {
            saveNotificationSettings.addEventListener('click', () => {
                this.saveNotificationPreferences();
            });
        }
        
        // Initialize logout all devices button
        const logoutAllDevices = document.getElementById('logoutAllDevices');
        if (logoutAllDevices) {
            logoutAllDevices.addEventListener('click', () => {
                if (confirm('Are you sure you want to log out from all devices?')) {
                    // In a real app, this would call an API
                    alert('You have been logged out from all devices.');
                    window.location.href = '/login.html';
                }
            });
        }
    }
    
    navigateToSection(section) {
        // Update active nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-section') === section) {
                item.classList.add('active');
            }
        });
        
        // Update active content section
        const contentSections = document.querySelectorAll('.content-section');
        contentSections.forEach(content => {
            content.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update section title and description
        const sectionTitle = document.getElementById('sectionTitle');
        const sectionDescription = document.getElementById('sectionDescription');
        
        if (sectionTitle && sectionDescription) {
            switch (section) {
                case 'dashboard':
                    sectionTitle.textContent = 'Dashboard';
                    sectionDescription.textContent = 'Welcome to your contractor portal';
                    break;
                case 'referrals':
                    sectionTitle.textContent = 'Referrals';
                    sectionDescription.textContent = 'Manage your customer referrals';
                    break;
                case 'profile':
                    sectionTitle.textContent = 'My Profile';
                    sectionDescription.textContent = 'View and edit your company profile';
                    break;
                case 'services':
                    sectionTitle.textContent = 'Services';
                    sectionDescription.textContent = 'Manage your service offerings';
                    break;
                case 'performance':
                    sectionTitle.textContent = 'Performance';
                    sectionDescription.textContent = 'Track your business metrics';
                    break;
                case 'settings':
                    sectionTitle.textContent = 'Settings';
                    sectionDescription.textContent = 'Manage your account settings';
                    break;
            }
        }
        
        // If on mobile, collapse sidebar after navigation
        if (window.innerWidth < 992) {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.add('collapsed');
            }
        }
    }
    
    navigateToSettingsSection(section) {
        // Update active settings nav item
        const settingsNavItems = document.querySelectorAll('.settings-nav-item');
        settingsNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-settings') === section) {
                item.classList.add('active');
            }
        });
        
        // Update active settings panel
        const settingsPanels = document.querySelectorAll('.settings-panel');
        settingsPanels.forEach(panel => {
            panel.classList.remove('active');
        });
        
        const targetPanel = document.getElementById(`${section}Settings`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    }
    
    async logout() {
        try {
            // Clear local storage
            localStorage.clear();
            
            // Redirect to login
            window.location.href = '/unified-login.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if logout fails
            localStorage.clear();
            window.location.href = '/unified-login.html';
        }
    }

    async loadContractorData() {
        try {
            // Use data from authentication if available
            if (this.contractorData) {
                this.updateContractorUI();
                return;
            }
            
            // Fetch contractor data from API
            const sessionToken = localStorage.getItem('sessionToken');
            const response = await fetch(`${this.apiBase}/Contractor/${this.contractorId}`, {
                headers: {
                    'Authorization': `Bearer ${sessionToken}`
                }
            });
            
            if (response.ok) {
                this.contractorData = await response.json();
            } else {
                // Fallback to localStorage data
                this.contractorData = {
                    contractorId: localStorage.getItem('contractorId'),
                    companyName: localStorage.getItem('companyName'),
                    contactName: localStorage.getItem('contactName')
                };
            }
            
            // Update UI with contractor data
            this.updateContractorUI();
            
        } catch (error) {
            console.error('Error loading contractor data:', error);
            this.showError('Failed to load your profile data. Please refresh the page.');
        }
    }
    
    updateContractorUI() {
        if (!this.contractorData) return;
        
        // Update sidebar profile
        const profileInitial = document.getElementById('profileInitial');
        const contractorName = document.getElementById('contractorName');
        const contractorStatus = document.getElementById('contractorStatus');
        const headerProfile = document.getElementById('headerProfile');
        
        if (profileInitial) {
            profileInitial.textContent = this.contractorData.companyName.charAt(0);
        }
        
        if (headerProfile) {
            const initial = document.querySelector('#headerProfile .profile-initial');
            if (initial) {
                initial.textContent = this.contractorData.companyName.charAt(0);
            }
        }
        
        if (contractorName) {
            contractorName.textContent = this.contractorData.companyName;
        }
        
        if (contractorStatus) {
            contractorStatus.textContent = this.contractorData.isActive ? 'Active' : 'Pending';
            contractorStatus.className = this.contractorData.isActive ? 'status-badge active' : 'status-badge pending';
        }
        
        // Update profile section
        const profileCompanyName = document.getElementById('profileCompanyName');
        const profileContactName = document.getElementById('profileContactName');
        const largeProfileInitial = document.getElementById('largeProfileInitial');
        const profileVerifiedBadge = document.getElementById('profileVerifiedBadge');
        const profileRatingBadge = document.getElementById('profileRatingBadge');
        const profileExperienceBadge = document.getElementById('profileExperienceBadge');
        
        if (profileCompanyName) {
            profileCompanyName.textContent = this.contractorData.companyName;
        }
        
        if (profileContactName) {
            profileContactName.textContent = this.contractorData.contactName;
        }
        
        if (largeProfileInitial) {
            largeProfileInitial.textContent = this.contractorData.companyName.charAt(0);
        }
        
        if (profileVerifiedBadge) {
            profileVerifiedBadge.textContent = this.contractorData.isActive ? '✓ Verified' : '⏳ Pending Verification';
        }
        
        if (profileRatingBadge) {
            profileRatingBadge.textContent = `⭐ ${this.contractorData.rating.toFixed(1)}`;
        }
        
        if (profileExperienceBadge) {
            profileExperienceBadge.textContent = `🔧 Experience: ${this.contractorData.experience || 'N/A'}`;
        }
        
        // Update profile info values
        const infoCompanyName = document.getElementById('infoCompanyName');
        const infoContactName = document.getElementById('infoContactName');
        const infoPhone = document.getElementById('infoPhone');
        const infoEmail = document.getElementById('infoEmail');
        const infoAddress = document.getElementById('infoAddress');
        const infoZipCode = document.getElementById('infoZipCode');
        const infoServiceRadius = document.getElementById('infoServiceRadius');
        const infoCoverageArea = document.getElementById('infoCoverageArea');
        const infoExperience = document.getElementById('infoExperience');
        const infoLicense = document.getElementById('infoLicense');
        const infoInsurance = document.getElementById('infoInsurance');
        
        if (infoCompanyName) infoCompanyName.textContent = this.contractorData.companyName;
        if (infoContactName) infoContactName.textContent = this.contractorData.contactName;
        if (infoPhone) infoPhone.textContent = this.contractorData.phone;
        if (infoEmail) infoEmail.textContent = this.contractorData.email || 'Not provided';
        if (infoAddress) infoAddress.textContent = this.contractorData.address || 'Not provided';
        if (infoZipCode) infoZipCode.textContent = `${this.contractorData.zipCode} - ${this.contractorData.city}`;
        if (infoServiceRadius) infoServiceRadius.textContent = `${this.contractorData.serviceRadius} miles`;
        if (infoCoverageArea) infoCoverageArea.textContent = `${this.contractorData.city} and surrounding areas`;
        if (infoExperience) infoExperience.textContent = this.contractorData.experience || 'Not specified';
        if (infoLicense) infoLicense.textContent = this.contractorData.license || 'Not provided';
        if (infoInsurance) infoInsurance.textContent = this.contractorData.insurance || 'Not provided';
    }
    
    populateProfileEditForm() {
        if (!this.contractorData) return;
        
        const editCompanyName = document.getElementById('editCompanyName');
        const editContactName = document.getElementById('editContactName');
        const editPhone = document.getElementById('editPhone');
        const editEmail = document.getElementById('editEmail');
        const editAddress = document.getElementById('editAddress');
        const editZipCode = document.getElementById('editZipCode');
        const editServiceRadius = document.getElementById('editServiceRadius');
        const editExperience = document.getElementById('editExperience');
        const editLicense = document.getElementById('editLicense');
        const editInsurance = document.getElementById('editInsurance');
        
        if (editCompanyName) editCompanyName.value = this.contractorData.companyName;
        if (editContactName) editContactName.value = this.contractorData.contactName;
        if (editPhone) editPhone.value = this.contractorData.phone;
        if (editEmail) editEmail.value = this.contractorData.email || '';
        if (editAddress) editAddress.value = this.contractorData.address || '';
        
        // Populate ZIP code dropdown
        if (editZipCode) {
            // Clear existing options
            editZipCode.innerHTML = '';
            
            // Add ZIP codes (in a real app, these would be fetched from the API)
            const zipCodes = [
                { value: '90210', text: '90210 - Beverly Hills' },
                { value: '90211', text: '90211 - Beverly Hills' },
                { value: '90212', text: '90212 - Beverly Hills' },
                { value: '90028', text: '90028 - Hollywood' },
                { value: '90038', text: '90038 - Hollywood' },
                { value: '90046', text: '90046 - West Hollywood' },
                { value: '90069', text: '90069 - West Hollywood' },
                { value: '90401', text: '90401 - Santa Monica' },
                { value: '90402', text: '90402 - Santa Monica' },
                { value: '90403', text: '90403 - Santa Monica' }
            ];
            
            zipCodes.forEach(zip => {
                const option = document.createElement('option');
                option.value = zip.value;
                option.textContent = zip.text;
                editZipCode.appendChild(option);
            });
            
            // Set selected ZIP code
            editZipCode.value = this.contractorData.zipCode;
        }
        
        if (editServiceRadius) editServiceRadius.value = this.contractorData.serviceRadius;
        if (editExperience) editExperience.value = this.contractorData.experience || '';
        if (editLicense) editLicense.value = this.contractorData.license || '';
        if (editInsurance) editInsurance.value = this.contractorData.insurance || '';
    }
    
    async saveProfileChanges() {
        try {
            const editProfileForm = document.getElementById('editProfileForm');
            if (!editProfileForm) return;
            
            const formData = new FormData(editProfileForm);
            
            // In a real app, this would send data to the API
            // For demo purposes, we'll just update the local data
            this.contractorData = {
                ...this.contractorData,
                companyName: formData.get('companyName'),
                contactName: formData.get('contactName'),
                phone: formData.get('phone'),
                email: formData.get('email') || null,
                address: formData.get('address') || null,
                zipCode: formData.get('zipCode'),
                serviceRadius: parseInt(formData.get('serviceRadius')),
                experience: formData.get('experience') || null,
                license: formData.get('license') || null,
                insurance: formData.get('insurance') || null,
                updatedDate: new Date().toISOString()
            };
            
            // Update UI with new data
            this.updateContractorUI();
            
            // Close modal
            const profileEditModal = document.getElementById('profileEditModal');
            const overlay = document.getElementById('overlay');
            
            if (profileEditModal && overlay) {
                profileEditModal.style.display = 'none';
                overlay.style.display = 'none';
            }
            
            this.showSuccess('Profile updated successfully!');
            
        } catch (error) {
            console.error('Error saving profile changes:', error);
            this.showError('Failed to save profile changes. Please try again.');
        }
    }
    
    async loadDashboardData() {
        try {
            // Load referrals
            await this.loadReferrals();
            
            // Update dashboard stats
            this.updateDashboardStats();
            
            // Render recent referrals
            this.renderRecentReferrals();
            
            // Initialize performance chart
            this.initializePerformanceChart();
            
            // Initialize service area map
            this.initializeServiceAreaMap();
            
            // Load services
            this.loadServices();
            
            // Load performance data
            this.loadPerformanceData();
            
            // Load notifications
            this.loadNotifications();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data. Please refresh the page.');
        }
    }
    
    async loadReferrals() {
        try {
            // In a real app, this would fetch from the API
            // For demo purposes, we'll use mock data
            this.referrals = [
                {
                    referralId: 1001,
                    customerName: "Alice Johnson",
                    phone: "(323) 555-1234",
                    serviceType: "Plumbing",
                    description: "Leaking kitchen sink",
                    status: "new",
                    createdDate: "2023-12-01T10:30:00Z",
                    updatedDate: null
                },
                {
                    referralId: 1002,
                    customerName: "Bob Williams",
                    phone: "(323) 555-5678",
                    serviceType: "HVAC",
                    description: "AC not cooling properly",
                    status: "contacted",
                    createdDate: "2023-11-28T14:45:00Z",
                    updatedDate: "2023-11-28T16:20:00Z"
                },
                {
                    referralId: 1003,
                    customerName: "Carol Davis",
                    phone: "(323) 555-9012",
                    serviceType: "Plumbing",
                    description: "Water heater replacement",
                    status: "scheduled",
                    createdDate: "2023-11-25T09:15:00Z",
                    updatedDate: "2023-11-25T11:30:00Z"
                },
                {
                    referralId: 1004,
                    customerName: "David Miller",
                    phone: "(323) 555-3456",
                    serviceType: "HVAC",
                    description: "Furnace inspection",
                    status: "completed",
                    createdDate: "2023-11-20T13:00:00Z",
                    updatedDate: "2023-11-22T15:45:00Z"
                },
                {
                    referralId: 1005,
                    customerName: "Emma Wilson",
                    phone: "(323) 555-7890",
                    serviceType: "Plumbing",
                    description: "Bathroom sink clogged",
                    status: "new",
                    createdDate: "2023-12-02T08:30:00Z",
                    updatedDate: null
                }
            ];
            
            // Render referrals table
            this.renderReferralsTable();
            this.updatePagination();
            
        } catch (error) {
            console.error('Error loading referrals:', error);
            throw error;
        }
    }
    
    updateDashboardStats() {
        const newReferralsCount = document.getElementById('newReferralsCount');
        const totalReferralsCount = document.getElementById('totalReferralsCount');
        const conversionRate = document.getElementById('conversionRate');
        const ratingValue = document.getElementById('ratingValue');
        const newReferralsBadge = document.getElementById('newReferralsBadge');
        
        if (!this.referrals) return;
        
        const newReferrals = this.referrals.filter(ref => ref.status === 'new').length;
        const totalReferrals = this.referrals.length;
        const completedReferrals = this.referrals.filter(ref => ref.status === 'completed').length;
        const conversionRateValue = totalReferrals > 0 ? (completedReferrals / totalReferrals * 100).toFixed(0) : 0;
        
        if (newReferralsCount) newReferralsCount.textContent = newReferrals;
        if (totalReferralsCount) totalReferralsCount.textContent = totalReferrals;
        if (conversionRate) conversionRate.textContent = `${conversionRateValue}%`;
        if (ratingValue && this.contractorData) ratingValue.textContent = this.contractorData.rating.toFixed(1);
        if (newReferralsBadge) {
            newReferralsBadge.textContent = newReferrals;
            newReferralsBadge.style.display = newReferrals > 0 ? 'inline-flex' : 'none';
        }
        
        // Update notification count
        const notificationCount = document.getElementById('notificationCount');
        if (notificationCount) {
            notificationCount.textContent = newReferrals;
            notificationCount.style.display = newReferrals > 0 ? 'flex' : 'none';
        }
    }
    
    renderRecentReferrals() {
        const recentReferralsList = document.getElementById('recentReferralsList');
        if (!recentReferralsList || !this.referrals) return;
        
        // Clear existing content
        recentReferralsList.innerHTML = '';
        
        // Get 3 most recent referrals
        const recentReferrals = [...this.referrals]
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
            .slice(0, 3);
        
        if (recentReferrals.length === 0) {
            recentReferralsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>No recent referrals</p>
                </div>
            `;
            return;
        }
        
        // Create referral items
        recentReferrals.forEach(referral => {
            const referralItem = document.createElement('div');
            referralItem.className = 'referral-item';
            
            const statusClass = this.getStatusClass(referral.status);
            const formattedDate = this.formatDate(referral.createdDate);
            
            referralItem.innerHTML = `
                <div class="referral-icon">📋</div>
                <div class="referral-details">
                    <h4 class="referral-title">${referral.customerName} - ${referral.serviceType}</h4>
                    <div class="referral-meta">
                        <span>${formattedDate}</span>
                        <span class="referral-status ${statusClass}">${this.formatStatus(referral.status)}</span>
                    </div>
                </div>
            `;
            
            referralItem.addEventListener('click', () => {
                this.navigateToSection('referrals');
                // Highlight the referral in the table
                setTimeout(() => {
                    const referralRow = document.querySelector(`tr[data-referral-id="${referral.referralId}"]`);
                    if (referralRow) {
                        referralRow.classList.add('highlighted');
                        referralRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            referralRow.classList.remove('highlighted');
                        }, 2000);
                    }
                }, 300);
            });
            
            recentReferralsList.appendChild(referralItem);
        });
    }
    
    renderReferralsTable() {
        const referralsTableBody = document.getElementById('referralsTableBody');
        const noReferralsMessage = document.getElementById('noReferralsMessage');
        
        if (!referralsTableBody || !noReferralsMessage || !this.referrals) return;
        
        // Clear existing content
        referralsTableBody.innerHTML = '';
        
        // Apply filters
        const filteredReferrals = this.getFilteredReferrals();
        
        if (filteredReferrals.length === 0) {
            referralsTableBody.innerHTML = '';
            noReferralsMessage.style.display = 'flex';
            return;
        }
        
        noReferralsMessage.style.display = 'none';
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedReferrals = filteredReferrals.slice(startIndex, endIndex);
        
        // Create table rows
        paginatedReferrals.forEach(referral => {
            const row = document.createElement('tr');
            row.setAttribute('data-referral-id', referral.referralId);
            
            const statusClass = this.getStatusClass(referral.status);
            const formattedDate = this.formatDate(referral.createdDate);
            
            row.innerHTML = `
                <td>${referral.referralId}</td>
                <td>${referral.customerName}</td>
                <td>${referral.serviceType}</td>
                <td>${formattedDate}</td>
                <td><span class="referral-status ${statusClass}">${this.formatStatus(referral.status)}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn view-btn">View</button>
                        <button class="table-btn update-btn">Update</button>
                    </div>
                </td>
            `;
            
            // Add event listeners to buttons
            const viewBtn = row.querySelector('.view-btn');
            const updateBtn = row.querySelector('.update-btn');
            
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    this.viewReferral(referral.referralId);
                });
            }
            
            if (updateBtn) {
                updateBtn.addEventListener('click', () => {
                    this.updateReferral(referral.referralId);
                });
            }
            
            referralsTableBody.appendChild(row);
        });
    }
    
    getFilteredReferrals() {
        if (!this.referrals) return [];
        
        const searchInput = document.getElementById('referralSearch');
        const statusFilter = document.getElementById('statusFilter');
        const dateFilter = document.getElementById('dateFilter');
        
        let filtered = [...this.referrals];
        
        // Apply search filter
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase();
            filtered = filtered.filter(ref => 
                ref.customerName.toLowerCase().includes(searchTerm) ||
                ref.serviceType.toLowerCase().includes(searchTerm) ||
                ref.referralId.toString().includes(searchTerm)
            );
        }
        
        // Apply status filter
        if (statusFilter && statusFilter.value !== 'all') {
            filtered = filtered.filter(ref => ref.status === statusFilter.value);
        }
        
        // Apply date filter
        if (dateFilter && dateFilter.value) {
            const filterDate = new Date(dateFilter.value);
            filterDate.setHours(0, 0, 0, 0);
            
            filtered = filtered.filter(ref => {
                const referralDate = new Date(ref.createdDate);
                referralDate.setHours(0, 0, 0, 0);
                return referralDate.getTime() === filterDate.getTime();
            });
        }
        
        return filtered;
    }
    
    filterReferrals() {
        this.currentPage = 1;
        this.renderReferralsTable();
        this.updatePagination();
    }
    
    updatePagination() {
        const paginationInfo = document.getElementById('paginationInfo');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        
        if (!paginationInfo || !prevPage || !nextPage) return;
        
        const filteredReferrals = this.getFilteredReferrals();
        this.totalPages = Math.ceil(filteredReferrals.length / this.itemsPerPage) || 1;
        
        paginationInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        prevPage.disabled = this.currentPage <= 1;
        nextPage.disabled = this.currentPage >= this.totalPages;
    }
    
    viewReferral(referralId) {
        const referral = this.referrals.find(ref => ref.referralId === referralId);
        if (!referral) return;
        
        alert(`
            Referral Details:
            ID: ${referral.referralId}
            Customer: ${referral.customerName}
            Phone: ${referral.phone}
            Service: ${referral.serviceType}
            Description: ${referral.description}
            Status: ${this.formatStatus(referral.status)}
            Created: ${this.formatDate(referral.createdDate)}
            ${referral.updatedDate ? `Updated: ${this.formatDate(referral.updatedDate)}` : ''}
        `);
    }
    
    updateReferral(referralId) {
        const referral = this.referrals.find(ref => ref.referralId === referralId);
        if (!referral) return;
        
        const newStatus = prompt(
            `Update status for referral #${referralId} (${referral.customerName})
            Current status: ${this.formatStatus(referral.status)}
            
            Enter new status (new, contacted, scheduled, completed, lost):`,
            referral.status
        );
        
        if (!newStatus) return;
        
        if (['new', 'contacted', 'scheduled', 'completed', 'lost'].includes(newStatus)) {
            // In a real app, this would call an API
            referral.status = newStatus;
            referral.updatedDate = new Date().toISOString();
            
            // Update UI
            this.renderReferralsTable();
            this.renderRecentReferrals();
            this.updateDashboardStats();
            
            this.showSuccess(`Referral #${referralId} status updated to ${this.formatStatus(newStatus)}`);
        } else {
            alert('Invalid status. Please enter one of: new, contacted, scheduled, completed, lost');
        }
    }
    
    initializePerformanceChart() {
        // In a real app, this would initialize a chart library like Chart.js
        const performanceChart = document.getElementById('performanceChart');
        if (!performanceChart) return;
        
        performanceChart.innerHTML = `
            <div style="height: 200px; display: flex; align-items: center; justify-content: center; color: #666;">
                Performance chart would be displayed here
            </div>
        `;
    }
    
    updatePerformanceChart(period) {
        // In a real app, this would update the chart with new data
        console.log(`Updating performance chart for period: ${period}`);
    }
    
    initializeServiceAreaMap() {
        // In a real app, this would initialize a map library like Google Maps
        const serviceAreaMap = document.getElementById('serviceAreaMap');
        if (!serviceAreaMap) return;
        
        serviceAreaMap.innerHTML = `
            <div style="height: 200px; display: flex; align-items: center; justify-content: center; color: #666;">
                Service area map would be displayed here
            </div>
        `;
    }
    
    loadServices() {
        // In a real app, this would fetch services from the API
        const servicesList = document.getElementById('servicesList');
        const pricingTable = document.getElementById('pricingTable');
        
        if (!servicesList || !pricingTable || !this.contractorData) return;
        
        // Clear existing content
        servicesList.innerHTML = '';
        pricingTable.innerHTML = '';
        
        // Parse service types
        let serviceTypes = [];
        try {
            serviceTypes = JSON.parse(this.contractorData.serviceTypes);
        } catch (error) {
            console.error('Error parsing service types:', error);
            serviceTypes = [];
        }
        
        // Create service items
        const allServices = [
            'Plumbing', 'Electrical', 'HVAC', 'Roofing', 
            'Flooring', 'Painting', 'Landscaping', 'Carpentry',
            'Drywall', 'Tile Work', 'Kitchen Remodeling', 
            'Bathroom Remodeling', 'General Contracting'
        ];
        
        allServices.forEach(service => {
            const isActive = serviceTypes.includes(service);
            
            const serviceItem = document.createElement('div');
            serviceItem.className = `service-item${isActive ? ' active' : ''}`;
            
            serviceItem.innerHTML = `
                <input type="checkbox" id="service_${service}" class="service-checkbox" ${isActive ? 'checked' : ''}>
                <label for="service_${service}" class="service-name">${service}</label>
            `;
            
            servicesList.appendChild(serviceItem);
            
            // Add pricing row for active services
            if (isActive) {
                const pricingRow = document.createElement('div');
                pricingRow.className = 'pricing-row';
                
                pricingRow.innerHTML = `
                    <div class="pricing-label">${service}</div>
                    <div class="pricing-inputs">
                        <input type="text" placeholder="Min $" value="$75">
                        <span>to</span>
                        <input type="text" placeholder="Max $" value="$150">
                    </div>
                `;
                
                pricingTable.appendChild(pricingRow);
            }
        });
    }
    
    saveServiceChanges() {
        // In a real app, this would send data to the API
        const serviceCheckboxes = document.querySelectorAll('.service-checkbox');
        const selectedServices = [];
        
        serviceCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const serviceId = checkbox.id.replace('service_', '');
                selectedServices.push(serviceId);
            }
        });
        
        if (this.contractorData) {
            this.contractorData.serviceTypes = JSON.stringify(selectedServices);
            this.updateContractorUI();
            this.loadServices();
            this.showSuccess('Services updated successfully!');
        }
    }
    
    loadPerformanceData() {
        // In a real app, this would fetch performance data from the API
        const performanceTableBody = document.getElementById('performanceTableBody');
        
        if (!performanceTableBody || !this.contractorData) return;
        
        // Clear existing content
        performanceTableBody.innerHTML = '';
        
        // Parse service types
        let serviceTypes = [];
        try {
            serviceTypes = JSON.parse(this.contractorData.serviceTypes);
        } catch (error) {
            console.error('Error parsing service types:', error);
            serviceTypes = [];
        }
        
        // Create performance rows
        serviceTypes.forEach(service => {
            const row = document.createElement('tr');
            
            // Generate random performance data for demo
            const totalReferrals = Math.floor(Math.random() * 20) + 5;
            const conversionRate = Math.floor(Math.random() * 40) + 60;
            const rating = (Math.random() * 2 + 3).toFixed(1);
            const trend = Math.random() > 0.5 ? 'up' : 'down';
            
            row.innerHTML = `
                <td>${service}</td>
                <td>${totalReferrals}</td>
                <td>${conversionRate}%</td>
                <td>${rating}</td>
                <td>${trend === 'up' ? '📈 +5%' : '📉 -3%'}</td>
            `;
            
            performanceTableBody.appendChild(row);
        });
        
        // Update performance metrics
        const conversionMetric = document.getElementById('conversionMetric');
        const satisfactionMetric = document.getElementById('satisfactionMetric');
        const responseTimeMetric = document.getElementById('responseTimeMetric');
        
        if (conversionMetric) conversionMetric.textContent = '72%';
        if (satisfactionMetric) satisfactionMetric.textContent = this.contractorData.rating.toFixed(1);
        if (responseTimeMetric) responseTimeMetric.textContent = '4h';
    }
    
    updatePerformanceData(range) {
        // In a real app, this would fetch new data based on the date range
        console.log(`Updating performance data for range: ${range}`);
    }
    
    loadNotifications() {
        // In a real app, this would fetch notifications from the API
        const notificationList = document.getElementById('notificationList');
        
        if (!notificationList) return;
        
        // Clear existing content
        notificationList.innerHTML = '';
        
        // Create notification items
        const notifications = [
            {
                id: 1,
                title: 'New Referral',
                message: 'You have received a new plumbing referral from Alice Johnson.',
                time: '10 minutes ago',
                isRead: false
            },
            {
                id: 2,
                title: 'Referral Status Update',
                message: 'Bob Williams has confirmed your appointment for HVAC service.',
                time: '2 hours ago',
                isRead: false
            },
            {
                id: 3,
                title: 'Profile Verification',
                message: 'Your contractor profile has been verified. You can now receive referrals.',
                time: '2 days ago',
                isRead: true
            }
        ];
        
        notifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item${notification.isRead ? '' : ' unread'}`;
            
            notificationItem.innerHTML = `
                <h4 class="notification-title">${notification.title}</h4>
                <p class="notification-message">${notification.message}</p>
                <span class="notification-time">${notification.time}</span>
            `;
            
            notificationList.appendChild(notificationItem);
        });
        
        // Update notification count
        const notificationCount = document.getElementById('notificationCount');
        if (notificationCount) {
            const unreadCount = notifications.filter(n => !n.isRead).length;
            notificationCount.textContent = unreadCount;
            notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }
    
    saveNotificationPreferences() {
        // In a real app, this would send data to the API
        this.showSuccess('Notification preferences saved!');
    }
    
    saveAccountSettings() {
        // In a real app, this would send data to the API
        this.showSuccess('Account settings saved!');
    }
    
    changePassword() {
        // In a real app, this would send data to the API
        const currentPassword = document.getElementById('currentPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (!currentPassword || !newPassword || !confirmPassword) return;
        
        if (newPassword.value !== confirmPassword.value) {
            this.showError('New passwords do not match.');
            return;
        }
        
        // Reset form
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        
        this.showSuccess('Password changed successfully!');
    }
    
    setupEventListeners() {
        // Most event listeners are set up in initializeUI
        // This method is for any additional listeners
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) {
                const sidebar = document.querySelector('.sidebar');
                if (sidebar) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
    
    showSuccess(message) {
        alert(`Success: ${message}`);
    }
    
    showError(message) {
        alert(`Error: ${message}`);
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    formatStatus(status) {
        const statusMap = {
            'new': 'New',
            'contacted': 'Contacted',
            'scheduled': 'Scheduled',
            'completed': 'Completed',
            'lost': 'Lost'
        };
        
        return statusMap[status] || status;
    }
    
    getStatusClass(status) {
        const classMap = {
            'new': 'status-new',
            'contacted': 'status-contacted',
            'scheduled': 'status-scheduled',
            'completed': 'status-completed',
            'lost': 'status-lost'
        };
        
        return classMap[status] || '';
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContractorDashboard();
});