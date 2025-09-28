// Call Center Management System - Optimized & Accessible
class CallCenterManager {
    constructor() {
        this.apiBase = CONFIG?.API_BASE_URL || 'http://localhost:5003/api/referral';
        this.currentCall = null;
        this.callQueue = [];
        this.stats = {
            callsToday: 0,
            referralsCreated: 0,
            avgCallTime: 0,
            queueLength: 0
        };
        this.activities = [];
        this.init();
    }

    init() {
        this.loadRealData();
        this.bindEvents();
        this.startRealTimeUpdates();
    }

    async loadRealData() {
        try {
            // Load all real data in parallel
            await Promise.all([
                this.loadCallQueue(),
                this.loadCallStats(),
                this.loadContractorStats(),
                this.loadRecentActivities()
            ]);
            
            // Update UI after all data is loaded
            this.updateUI();
            
        } catch (error) {
            console.error('Failed to load call center data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    async loadCallQueue() {
        try {
            const response = await fetch('/api/CallCenter/queue/status');
            if (!response.ok) throw new Error('Failed to load queue');
            
            const data = await response.json();
            
            // Transform API data to match UI format
            this.callQueue = data.calls.map(call => ({
                id: call.queueId,
                customerName: call.callerName,
                phone: call.callerPhone,
                serviceType: call.serviceType,
                location: 'ZIP: N/A', // API doesn't provide ZIP
                priority: call.priority.toLowerCase(),
                waitTime: this.formatWaitTime(call.waitTime)
            }));
            
        } catch (error) {
            console.error('Failed to load call queue:', error);
            this.callQueue = [];
        }
    }

    async loadCallStats() {
        try {
            const response = await fetch('/api/CallCenter/reports/dashboard');
            if (!response.ok) throw new Error('Failed to load stats');
            
            const data = await response.json();
            
            // Transform API data to match UI format
            this.stats = {
                callsToday: data.realTime.todaysCalls,
                referralsCreated: data.realTime.todaysAnswered, // Using answered calls as referrals
                avgCallTime: '0:00', // Will be calculated from call statistics
                queueLength: data.realTime.currentQueue,
                activeAgents: data.realTime.availableAgents
            };
            
            // Get more detailed stats and agent count
            await Promise.all([
                this.loadDetailedCallStats(),
                this.loadAgentCount()
            ]);
            
            // Update main dashboard stats
            this.updateMainStats();
            
        } catch (error) {
            console.error('Failed to load call stats:', error);
            this.stats = {
                callsToday: 0,
                referralsCreated: 0,
                avgCallTime: '0:00',
                queueLength: 0,
                activeAgents: 0
            };
            this.updateMainStats();
        }
    }

    async loadAgentCount() {
        try {
            const response = await fetch('/api/CallCenter/agents/status');
            if (!response.ok) return;
            
            const agents = await response.json();
            
            // Count available agents
            this.stats.activeAgents = agents.filter(agent => agent.status === 'Available').length;
            
        } catch (error) {
            console.error('Failed to load agent count:', error);
        }
    }

    async loadDetailedCallStats() {
        try {
            const response = await fetch('/api/CallCenter/reports/call-statistics');
            if (!response.ok) return;
            
            const data = await response.json();
            
            // Update average wait time from detailed stats
            if (data.summary.avgWaitTime > 0) {
                this.stats.avgWaitTime = this.formatDuration(data.summary.avgWaitTime);
            } else {
                this.stats.avgWaitTime = '0:00';
            }
            
        } catch (error) {
            console.error('Failed to load detailed call stats:', error);
        }
    }

    async loadRecentActivities() {
        try {
            // For now, create activities based on real data
            this.activities = [];
            
            // Add contractor update activity
            if (this.stats.callsToday > 0) {
                this.activities.push({
                    type: 'call',
                    title: 'Calls Handled Today',
                    description: `${this.stats.callsToday} calls processed`,
                    time: 'Today'
                });
            }
            
            // Add queue status activity
            if (this.callQueue.length > 0) {
                this.activities.push({
                    type: 'update',
                    title: 'Queue Status',
                    description: `${this.callQueue.length} calls waiting`,
                    time: 'Live'
                });
            } else {
                this.activities.push({
                    type: 'update',
                    title: 'Queue Status',
                    description: 'No calls in queue',
                    time: 'Live'
                });
            }
            
            // Add contractor database activity
            this.activities.push({
                type: 'referral',
                title: 'Contractor Database',
                description: 'Database updated with real contractors',
                time: 'Recently'
            });
            
        } catch (error) {
            console.error('Failed to load activities:', error);
            this.activities = [];
        }
    }

    formatWaitTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    async loadContractorStats() {
        try {
            // Load real contractor statistics from API
            const response = await fetch('/api/Contractors');
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contractors = await response.json();
            
            // Calculate today's registrations
            const today = new Date().toDateString();
            const todayRegistrations = contractors.filter(c => 
                new Date(c.dateAdded).toDateString() === today
            ).length;
            
            const stats = {
                total: contractors.length,
                pending: 0, // No pending contractors in current API
                todayRegistrations: todayRegistrations,
                activeReferrals: this.stats.callsToday || 0 // Use today's calls as active referrals
            };
            
            // Update contractor stats in UI
            this.updateContractorStats(stats);
            
        } catch (error) {
            console.error('Failed to load contractor stats:', error);
            // Fallback to show 0 values
            this.updateContractorStats({
                total: 0,
                pending: 0,
                todayRegistrations: 0,
                activeReferrals: 0
            });
        }
    }

    updateContractorStats(stats) {
        // Update contractor statistics display
        const elements = {
            totalContractors: document.getElementById('totalContractors'),
            pendingContractors: document.getElementById('pendingContractors'),
            todayRegistrations: document.getElementById('todayRegistrations'),
            activeReferrals: document.getElementById('activeReferrals')
        };

        if (elements.totalContractors) elements.totalContractors.textContent = stats.total;
        if (elements.pendingContractors) elements.pendingContractors.textContent = stats.pending;
        if (elements.todayRegistrations) elements.todayRegistrations.textContent = stats.todayRegistrations;
        if (elements.activeReferrals) elements.activeReferrals.textContent = stats.activeReferrals;
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('callCenterReferralForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleReferralSubmit(e));
        }

        // Reports button
        const reportsBtn = document.getElementById('reportsBtn');
        if (reportsBtn) {
            reportsBtn.addEventListener('click', () => this.openReports());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleKeyboardShortcuts(e) {
        // Alt + A: Answer next call
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            this.answerNext();
        }
        
        // Alt + H: Hold current call
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            this.holdCall();
        }
        
        // Alt + E: End current call
        if (e.altKey && e.key === 'e') {
            e.preventDefault();
            this.endCall();
        }
    }

    updateUI() {
        this.updateStats();
        this.updateCallQueue();
        this.updateActivityFeed();
    }

    updateStats() {
        const elements = {
            callsToday: document.getElementById('callsToday'),
            referralsCreated: document.getElementById('referralsCreated'),
            avgCallTime: document.getElementById('avgCallTime'),
            queueLength: document.getElementById('queueLength')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = this.stats[key];
            }
        });
    }

    updateCallQueue() {
        const queueContainer = document.getElementById('callQueue');
        const queueLengthElement = document.getElementById('queueLength');
        
        if (!queueContainer) return;

        // Update queue count
        if (queueLengthElement) {
            queueLengthElement.textContent = this.callQueue.length;
        }

        if (this.callQueue.length === 0) {
            // Show empty state
            queueContainer.innerHTML = `
                <div class="empty-queue" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📞</div>
                    <div>No calls in queue</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem;">Calls will appear here when received</div>
                </div>
            `;
        } else {
            // Show call queue items
            queueContainer.innerHTML = this.callQueue.map(call => `
                <div class="queue-item priority-${call.priority}" onclick="selectCall(${call.id})">
                    <div class="caller-info">
                        <div class="caller-name">${call.customerName}</div>
                        <div class="caller-phone">${call.phone}</div>
                        <div class="service-type">${call.serviceType}</div>
                    </div>
                    <div class="call-details">
                        <div class="wait-time">${call.waitTime}</div>
                        <div class="priority-tag ${call.priority}">${call.priority.toUpperCase()}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    updateActivityFeed() {
        const feedContainer = document.getElementById('activityFeed');
        if (!feedContainer) return;

        if (this.activities.length === 0) {
            // Show empty state
            feedContainer.innerHTML = `
                <div class="empty-activity" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📈</div>
                    <div>No recent activity</div>
                    <div style="font-size: 0.875rem; margin-top: 0.5rem;">Activity will appear here as calls are processed</div>
                </div>
            `;
        } else {
            // Show activity items
            feedContainer.innerHTML = this.activities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon activity-${activity.type}">
                        ${this.getActivityIcon(activity.type)}
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-desc">${activity.description}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');
        }
    }

    getActivityIcon(type) {
        const icons = {
            referral: '📋',
            call: '📞',
            update: '🔄'
        };
        return icons[type] || '📝';
    }

    async handleReferralSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            customerName: formData.get('quickCustomerName') || document.getElementById('quickCustomerName').value,
            customerPhone: formData.get('quickCustomerPhone') || document.getElementById('quickCustomerPhone').value,
            zipCode: formData.get('quickZipCode') || document.getElementById('quickZipCode').value,
            serviceType: formData.get('quickServiceType') || document.getElementById('quickServiceType').value,
            notes: formData.get('quickNotes') || document.getElementById('quickNotes').value
        };

        if (!this.validateReferralData(data)) return;

        try {
            this.showLoading(true);
            this.currentReferralData = data; // Store for later use
            const contractors = await this.findContractors(data);
            this.displayContractorResults(contractors, data);
        } catch (error) {
            this.showNotification('Error finding contractors: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    validateReferralData(data) {
        const required = ['customerName', 'customerPhone', 'zipCode', 'serviceType'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            this.showNotification(`Please fill in: ${missing.join(', ')}`, 'error');
            return false;
        }

        // Validate ZIP code format
        if (!/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
            this.showNotification('Please enter a valid ZIP code', 'error');
            return false;
        }

        // Validate phone format
        if (!/^\(\d{3}\)\s\d{3}-\d{4}$/.test(data.customerPhone) && !/^\d{10}$/.test(data.customerPhone.replace(/\D/g, ''))) {
            this.showNotification('Please enter a valid phone number', 'error');
            return false;
        }

        return true;
    }

    async findContractors(data) {
        try {
            const response = await fetch(`${this.apiBase}/get-three-referrals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    zipCode: data.zipCode,
                    serviceType: data.serviceType,
                    customerName: data.customerName,
                    customerPhone: data.customerPhone,
                    createdBy: 'Call Center'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'No contractors found');
            }

            return result.contractors.map(c => ({
                id: c.contractorId,
                name: c.companyName,
                phone: c.phone,
                rating: c.rating,
                distance: c.distance,
                specialties: c.serviceTypes || [],
                available: true,
                contactName: c.contactName,
                email: c.email,
                address: c.address,
                city: c.city,
                zipCode: c.zipCode
            }));
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    displayContractorResults(contractors, customerData) {
        const resultsContainer = document.getElementById('contractorResults');
        const contractorsList = document.getElementById('contractorsList');
        
        if (!resultsContainer || !contractorsList) return;

        contractorsList.innerHTML = contractors.map(contractor => `
            <div class="card" style="margin-bottom: 1rem; ${!contractor.available ? 'opacity: 0.6;' : ''}">
                <div class="card-content">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: var(--gray-900);">${contractor.name}</h4>
                            <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: var(--gray-600);">
                                <span>⭐ ${contractor.rating}</span>
                                <span>📍 ${contractor.distance} miles</span>
                                <span>📞 ${contractor.phone}</span>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.75rem; color: ${contractor.available ? 'var(--success)' : 'var(--error)'}; font-weight: 600; text-transform: uppercase;">
                                ${contractor.available ? 'Available' : 'Busy'}
                            </div>
                        </div>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong>Specialties:</strong> ${contractor.specialties.join(', ')}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="checkbox" id="contractor-${contractor.id}" 
                               ${contractor.available ? '' : 'disabled'} 
                               onchange="toggleContractorSelection(${contractor.id})">
                        <label for="contractor-${contractor.id}">Select for referral</label>
                    </div>
                </div>
            </div>
        `).join('');

        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Store customer data for referral creation
        this.currentReferralData = customerData;
        this.availableContractors = contractors;
    }

    showLoading(show) {
        const submitBtn = document.querySelector('#callCenterReferralForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = show;
            submitBtn.textContent = show ? 'Finding Contractors...' : 'Find Contractors';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} show`;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    startRealTimeUpdates() {
        // Real-time updates using actual API data
        setInterval(async () => {
            try {
                await Promise.all([
                    this.loadCallQueue(),
                    this.loadCallStats(),
                    this.loadContractorStats()
                ]);
                this.updateUI();
                this.updateMainStats();
            } catch (error) {
                console.error('Failed to update real-time data:', error);
            }
        }, 30000); // Update every 30 seconds
        
        // Update current time display
        setInterval(() => {
            this.updateCurrentTime();
        }, 1000);
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString();
        }
    }

    updateMainStats() {
        // Update main dashboard stats with real data
        const elements = {
            totalCallsToday: document.getElementById('totalCallsToday'),
            resolvedCalls: document.getElementById('resolvedCalls'),
            avgWaitTime: document.getElementById('avgWaitTime'),
            activeAgents: document.getElementById('activeAgents'),
            agentsStatus: document.getElementById('agentsStatus')
        };

        if (elements.totalCallsToday) {
            elements.totalCallsToday.textContent = this.stats.callsToday;
        }
        
        if (elements.resolvedCalls) {
            elements.resolvedCalls.textContent = this.stats.referralsCreated;
        }
        
        if (elements.avgWaitTime) {
            elements.avgWaitTime.textContent = this.stats.avgCallTime;
        }
        
        if (elements.activeAgents) {
            elements.activeAgents.textContent = this.stats.activeAgents;
        }
        
        if (elements.agentsStatus) {
            if (this.stats.activeAgents > 0) {
                elements.agentsStatus.textContent = `${this.stats.activeAgents} Online`;
                elements.agentsStatus.className = 'stat-change positive';
            } else {
                elements.agentsStatus.textContent = 'Offline';
                elements.agentsStatus.className = 'stat-change neutral';
            }
        }
    }



    addActivity(type, title, description, time) {
        this.activities.unshift({ type, title, description, time });
        if (this.activities.length > 10) {
            this.activities = this.activities.slice(0, 10);
        }
        this.updateActivityFeed();
    }

    openReports() {
        // Navigate to the call center reports page
        window.location.href = 'call-center-reports.html';
    }
}

// Global functions for HTML onclick handlers
let callCenter;

function answerNext() {
    if (callCenter.callQueue.length > 0) {
        answerCall(callCenter.callQueue[0].id);
    }
}

function answerCall(callId) {
    const call = callCenter.callQueue.find(c => c.id === callId);
    if (!call) return;

    // Remove from queue
    callCenter.callQueue = callCenter.callQueue.filter(c => c.id !== callId);
    callCenter.stats.queueLength = callCenter.callQueue.length;
    
    // Set as current call
    callCenter.currentCall = call;
    
    // Update UI
    const activeCallDiv = document.getElementById('activeCall');
    if (activeCallDiv) {
        document.getElementById('customerName').textContent = call.customerName;
        document.getElementById('customerPhone').textContent = call.phone;
        document.getElementById('serviceType').textContent = call.serviceType;
        document.getElementById('customerLocation').textContent = call.location;
        activeCallDiv.style.display = 'block';
    }
    
    // Pre-fill referral form
    document.getElementById('quickCustomerName').value = call.customerName;
    document.getElementById('quickCustomerPhone').value = call.phone;
    document.getElementById('quickZipCode').value = call.location;
    document.getElementById('quickServiceType').value = call.serviceType;
    
    callCenter.updateUI();
    callCenter.addActivity('call', 'Call Answered', `${call.customerName} - ${call.serviceType}`, 'Just now');
}

function holdCall() {
    if (callCenter.currentCall) {
        callCenter.showNotification('Call placed on hold', 'info');
        callCenter.addActivity('call', 'Call On Hold', callCenter.currentCall.customerName, 'Just now');
    }
}

function transferCall() {
    if (callCenter.currentCall) {
        document.getElementById('transferModal').classList.add('active');
    }
}

function endCall() {
    if (callCenter.currentCall) {
        const activeCallDiv = document.getElementById('activeCall');
        if (activeCallDiv) {
            activeCallDiv.style.display = 'none';
        }
        
        callCenter.addActivity('call', 'Call Completed', `${callCenter.currentCall.customerName} - Call ended`, 'Just now');
        callCenter.stats.callsToday++;
        callCenter.currentCall = null;
        callCenter.updateUI();
        clearForm();
    }
}

function createReferral() {
    document.getElementById('quickReferralForm').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('quickCustomerName').focus();
}

function clearForm() {
    const form = document.getElementById('callCenterReferralForm');
    if (form) {
        form.reset();
    }
    
    const resultsContainer = document.getElementById('contractorResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'none';
    }
}

function selectCall(callId) {
    // Highlight selected call in queue
    document.querySelectorAll('.queue-item').forEach(item => {
        item.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

function toggleContractorSelection(contractorId) {
    // Handle contractor selection for referral
    console.log('Contractor selected:', contractorId);
}

async function createReferralFromResults() {
    const selectedContractors = [];
    document.querySelectorAll('input[id^="contractor-"]:checked').forEach(checkbox => {
        const contractorId = parseInt(checkbox.id.split('-')[1]);
        selectedContractors.push(contractorId);
    });
    
    if (selectedContractors.length === 0) {
        callCenter.showNotification('Please select at least one contractor', 'warning');
        return;
    }

    try {
        const response = await fetch(`${callCenter.apiBase}/create-referral`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerName: callCenter.currentReferralData?.customerName || '',
                customerPhone: callCenter.currentReferralData?.customerPhone || '',
                customerZipCode: callCenter.currentReferralData?.zipCode || '',
                serviceType: callCenter.currentReferralData?.serviceType || '',
                contractorIds: selectedContractors,
                createdBy: 'Call Center'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            callCenter.stats.referralsCreated++;
            callCenter.updateUI();
            callCenter.addActivity('referral', 'Referral Created', 
                `${callCenter.currentReferralData?.customerName} - ${selectedContractors.length} contractor(s) - ID: ${result.referralId}`, 'Just now');
            
            callCenter.showNotification(`Referral created successfully! ID: ${result.referralId}`, 'success');
        } else {
            throw new Error(result.message || 'Failed to create referral');
        }
    } catch (error) {
        console.error('Error creating referral:', error);
        callCenter.showNotification('Error creating referral: ' + error.message, 'error');
        return;
    }
    
    clearForm();
    
    if (callCenter.currentCall) {
        endCall();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

async function confirmTransfer() {
    const target = document.getElementById('transferTarget').value;
    const notes = document.getElementById('transferNotes').value;
    
    if (!target) {
        callCenter.showNotification('Please select a transfer target', 'error');
        return;
    }

    try {
        const transferData = {
            callId: callCenter.currentCall.callId,
            fromAgentId: callCenter.currentAgent.agentId,
            transferReason: notes || 'No reason provided',
            transferType: 'Warm',
            notes: notes
        };

        // Determine if transferring to agent or department
        if (target.startsWith('agent_')) {
            transferData.toAgentId = parseInt(target.replace('agent_', ''));
        } else {
            transferData.toDepartment = target;
        }

        const response = await fetch(`/api/CallCenter/calls/${callCenter.currentCall.callId}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transferData)
        });

        if (response.ok) {
            const result = await response.json();
            callCenter.showNotification(`Call transferred successfully to ${result.target}`, 'success');
            callCenter.addActivity('call', 'Call Transferred', `${callCenter.currentCall.customerName} → ${result.target}`, 'Just now');
            
            closeModal('transferModal');
            endCall();
        } else {
            const error = await response.json();
            callCenter.showNotification(`Transfer failed: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Transfer error:', error);
        callCenter.showNotification('Transfer failed: Network error', 'error');
    }
}

// Transfer management functions
async function loadPendingTransfers() {
    try {
        const response = await fetch('/api/CallCenter/transfers/pending');
        if (response.ok) {
            const transfers = await response.json();
            displayPendingTransfers(transfers);
        }
    } catch (error) {
        console.error('Error loading pending transfers:', error);
    }
}

function displayPendingTransfers(transfers) {
    const container = document.getElementById('pendingTransfers');
    if (!container) return;

    if (transfers.length === 0) {
        container.innerHTML = '<p class="no-transfers">No pending transfers</p>';
        return;
    }

    container.innerHTML = transfers.map(transfer => `
        <div class="transfer-item" data-transfer-id="${transfer.transferId}">
            <div class="transfer-header">
                <span class="transfer-type">${transfer.transferTypeIcon} ${transfer.transferType}</span>
                <span class="transfer-time">${new Date(transfer.transferTime).toLocaleTimeString()}</span>
            </div>
            <div class="transfer-details">
                <strong>From:</strong> ${transfer.fromAgent}<br>
                <strong>Customer:</strong> ${transfer.callerName} (${transfer.callerPhone})<br>
                <strong>Reason:</strong> ${transfer.transferReason}
                ${transfer.notes ? `<br><strong>Notes:</strong> ${transfer.notes}` : ''}
            </div>
            <div class="transfer-actions">
                <button onclick="acceptTransfer(${transfer.transferId})" class="btn-accept">Accept</button>
                <button onclick="rejectTransfer(${transfer.transferId})" class="btn-reject">Reject</button>
            </div>
        </div>
    `).join('');
}

async function acceptTransfer(transferId) {
    try {
        const response = await fetch(`/api/CallCenter/transfers/${transferId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transferId: transferId,
                agentId: callCenter.currentAgent.agentId
            })
        });

        if (response.ok) {
            callCenter.showNotification('Transfer accepted successfully', 'success');
            loadPendingTransfers(); // Refresh the list
        } else {
            const error = await response.json();
            callCenter.showNotification(`Failed to accept transfer: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error accepting transfer:', error);
        callCenter.showNotification('Failed to accept transfer: Network error', 'error');
    }
}

async function rejectTransfer(transferId) {
    const reason = prompt('Please provide a reason for rejecting this transfer:');
    if (!reason) return;

    try {
        const response = await fetch(`/api/CallCenter/transfers/${transferId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transferId: transferId,
                agentId: callCenter.currentAgent.agentId,
                rejectionReason: reason
            })
        });

        if (response.ok) {
            callCenter.showNotification('Transfer rejected', 'success');
            loadPendingTransfers(); // Refresh the list
        } else {
            const error = await response.json();
            callCenter.showNotification(`Failed to reject transfer: ${error.error}`, 'error');
        }
    } catch (error) {
        console.error('Error rejecting transfer:', error);
        callCenter.showNotification('Failed to reject transfer: Network error', 'error');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    callCenter = new CallCenterManager();
    
    // Load pending transfers every 30 seconds
    setInterval(loadPendingTransfers, 30000);
    loadPendingTransfers(); // Initial load
});

// Add CSS for selected queue item
const style = document.createElement('style');
style.textContent = `
    .queue-item.selected {
        background: var(--primary) !important;
        color: white;
    }
    .queue-item.selected .info-value {
        color: white !important;
    }
`;
document.head.appendChild(style);