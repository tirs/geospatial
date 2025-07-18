// Call Center Reports JavaScript
class CallCenterReports {
    constructor() {
        this.charts = {};
        this.currentFilters = {};
        this.init();
    }

    init() {
        this.setDefaultDates();
        this.loadInitialData();
    }

    setDefaultDates() {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    }

    async loadInitialData() {
        await this.loadAgents();
        await this.loadServiceTypes();
        await this.loadReports();
    }

    async loadAgents() {
        try {
            const response = await fetch('/api/CallCenter/agents/status');
            if (response.ok) {
                const data = await response.json();
                const select = document.getElementById('agentFilter');
                select.innerHTML = '<option value="">All Agents</option>';
                
                data.forEach(agent => {
                    const option = document.createElement('option');
                    option.value = agent.agentId;
                    option.textContent = `${agent.agentName} (${agent.agentCode})`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading agents:', error);
        }
    }

    async loadServiceTypes() {
        // For now, add common service types
        const serviceTypes = ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'General Contractor'];
        const select = document.getElementById('serviceTypeFilter');
        select.innerHTML = '<option value="">All Services</option>';
        
        serviceTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            select.appendChild(option);
        });
    }

    getFilters() {
        return {
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            agentId: document.getElementById('agentFilter').value || null,
            serviceType: document.getElementById('serviceTypeFilter').value || null
        };
    }

    async loadReports() {
        this.currentFilters = this.getFilters();
        
        try {
            await Promise.all([
                this.loadOverview(),
                this.loadCallStatistics(),
                this.loadAgentPerformance(),
                this.loadQueueAnalytics(),
                this.loadCustomerSatisfaction()
            ]);
        } catch (error) {
            console.error('Error loading reports:', error);
            this.showError('Failed to load reports. Please try again.');
        }
    }

    async loadOverview() {
        try {
            const response = await fetch('/api/CallCenter/reports/dashboard');
            if (response.ok) {
                const data = await response.json();
                this.renderOverviewStats(data);
                this.renderMonthlyTrends(data.monthlyStats);
                this.renderRealTimeStatus(data.realTime);
            }
        } catch (error) {
            console.error('Error loading overview:', error);
        }
    }

    async loadCallStatistics() {
        try {
            const params = new URLSearchParams(this.currentFilters);
            const response = await fetch(`/api/CallCenter/reports/call-statistics?${params}`);
            if (response.ok) {
                const data = await response.json();
                this.renderCallStats(data);
                this.renderDailyCallsChart(data.dailyStats);
                this.renderServiceTypeChart(data.serviceTypeStats);
            }
        } catch (error) {
            console.error('Error loading call statistics:', error);
        }
    }

    async loadAgentPerformance() {
        try {
            const params = new URLSearchParams(this.currentFilters);
            const response = await fetch(`/api/CallCenter/reports/agent-performance?${params}`);
            if (response.ok) {
                const data = await response.json();
                this.renderAgentStats(data);
                this.renderAgentTable(data.agentStats);
            }
        } catch (error) {
            console.error('Error loading agent performance:', error);
        }
    }

    async loadQueueAnalytics() {
        try {
            const params = new URLSearchParams(this.currentFilters);
            const response = await fetch(`/api/CallCenter/reports/queue-analytics?${params}`);
            if (response.ok) {
                const data = await response.json();
                this.renderQueueStats(data);
                this.renderHourlyChart(data.hourlyStats);
                this.renderPriorityChart(data.priorityStats);
            }
        } catch (error) {
            console.error('Error loading queue analytics:', error);
        }
    }

    async loadCustomerSatisfaction() {
        try {
            const params = new URLSearchParams(this.currentFilters);
            const response = await fetch(`/api/CallCenter/reports/customer-satisfaction?${params}`);
            if (response.ok) {
                const data = await response.json();
                this.renderSatisfactionStats(data);
                this.renderSatisfactionChart(data.distribution);
                this.renderSatisfactionTrends(data.dailyTrends);
                this.renderSatisfactionTable(data.agentSatisfaction);
            } else {
                console.error('Customer satisfaction API error:', response.status, response.statusText);
                this.showSatisfactionError(`API Error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error loading customer satisfaction:', error);
            this.showSatisfactionError('Failed to load customer satisfaction data');
        }
    }

    renderOverviewStats(data) {
        const container = document.getElementById('overviewStats');
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${data.realTime.todaysCalls}</div>
                <div class="stat-label">Today's Calls</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.realTime.answerRate}%</div>
                <div class="stat-label">Answer Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.realTime.currentQueue}</div>
                <div class="stat-label">Current Queue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.realTime.availableAgents}</div>
                <div class="stat-label">Available Agents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.weeklyTrends.customerSatisfaction}</div>
                <div class="stat-label">Weekly Satisfaction</div>
            </div>
        `;
    }

    renderCallStats(data) {
        const container = document.getElementById('callStats');
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${data.summary.totalCalls}</div>
                <div class="stat-label">Total Calls</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.answerRate}%</div>
                <div class="stat-label">Answer Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.abandonRate}%</div>
                <div class="stat-label">Abandon Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(data.summary.avgWaitTime)}s</div>
                <div class="stat-label">Avg Wait Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(data.summary.avgCallDuration)}s</div>
                <div class="stat-label">Avg Call Duration</div>
            </div>
        `;
    }

    renderAgentStats(data) {
        const container = document.getElementById('agentStats');
        const topPerformer = data.topPerformers[0];
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${data.agentStats.length}</div>
                <div class="stat-label">Active Agents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${topPerformer ? topPerformer.customerSatisfaction : 'N/A'}</div>
                <div class="stat-label">Top Agent Rating</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.agentStats.reduce((sum, a) => sum + a.totalCalls, 0)}</div>
                <div class="stat-label">Total Agent Calls</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(data.agentStats.reduce((sum, a) => sum + a.totalTalkTime, 0) / data.agentStats.length)}</div>
                <div class="stat-label">Avg Talk Time (min)</div>
            </div>
        `;
    }

    renderQueueStats(data) {
        const container = document.getElementById('queueStats');
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${data.summary.totalQueuedCalls}</div>
                <div class="stat-label">Total Queued Calls</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(data.summary.avgWaitTime)}s</div>
                <div class="stat-label">Avg Wait Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.maxWaitTime}s</div>
                <div class="stat-label">Max Wait Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.currentQueueLength}</div>
                <div class="stat-label">Current Queue Length</div>
            </div>
        `;
    }

    renderSatisfactionStats(data) {
        const container = document.getElementById('satisfactionStats');
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${data.summary.overallSatisfaction}</div>
                <div class="stat-label">Overall Satisfaction</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.satisfactionRate}%</div>
                <div class="stat-label">High Satisfaction Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.totalRatings}</div>
                <div class="stat-label">Total Ratings</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${data.summary.highSatisfaction}</div>
                <div class="stat-label">High Ratings (4-5)</div>
            </div>
        `;
    }

    showSatisfactionError(message) {
        const container = document.getElementById('satisfactionStats');
        container.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <div class="error-text">${message}</div>
                <button onclick="window.reportsManager.loadCustomerSatisfaction()" class="retry-btn">Retry</button>
            </div>
        `;
    }

    renderMonthlyTrends(data) {
        const ctx = document.getElementById('monthlyTrendsChart').getContext('2d');
        
        if (this.charts.monthlyTrends) {
            this.charts.monthlyTrends.destroy();
        }

        this.charts.monthlyTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Total Calls',
                    data: data.map(d => d.calls),
                    borderColor: '#2b6cb0',
                    backgroundColor: 'rgba(43, 108, 176, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Answered Calls',
                    data: data.map(d => d.answered),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderRealTimeStatus(data) {
        const ctx = document.getElementById('realTimeChart').getContext('2d');
        
        if (this.charts.realTime) {
            this.charts.realTime.destroy();
        }

        this.charts.realTime = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Answered', 'In Queue', 'Available Agents'],
                datasets: [{
                    data: [data.todaysAnswered, data.currentQueue, data.availableAgents],
                    backgroundColor: ['#10b981', '#f59e0b', '#2b6cb0']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderDailyCallsChart(data) {
        const ctx = document.getElementById('dailyCallsChart').getContext('2d');
        
        if (this.charts.dailyCalls) {
            this.charts.dailyCalls.destroy();
        }

        this.charts.dailyCalls = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Total Calls',
                    data: data.map(d => d.totalCalls),
                    backgroundColor: '#2b6cb0'
                }, {
                    label: 'Answered',
                    data: data.map(d => d.answeredCalls),
                    backgroundColor: '#10b981'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderServiceTypeChart(data) {
        const ctx = document.getElementById('serviceTypeChart').getContext('2d');
        
        if (this.charts.serviceType) {
            this.charts.serviceType.destroy();
        }

        this.charts.serviceType = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(d => d.serviceType),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: [
                        '#2b6cb0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
                        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderHourlyChart(data) {
        const ctx = document.getElementById('hourlyChart').getContext('2d');
        
        if (this.charts.hourly) {
            this.charts.hourly.destroy();
        }

        this.charts.hourly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `${d.hour}:00`),
                datasets: [{
                    label: 'Calls per Hour',
                    data: data.map(d => d.totalCalls),
                    backgroundColor: '#2b6cb0'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderPriorityChart(data) {
        const ctx = document.getElementById('priorityChart').getContext('2d');
        
        if (this.charts.priority) {
            this.charts.priority.destroy();
        }

        this.charts.priority = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.priority),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderSatisfactionChart(data) {
        const ctx = document.getElementById('satisfactionChart').getContext('2d');
        
        if (this.charts.satisfaction) {
            this.charts.satisfaction.destroy();
        }

        this.charts.satisfaction = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `${d.rating} Stars`),
                datasets: [{
                    label: 'Number of Ratings',
                    data: data.map(d => d.count),
                    backgroundColor: data.map(d => {
                        if (d.rating >= 4) return '#10b981';
                        if (d.rating >= 3) return '#f59e0b';
                        return '#ef4444';
                    })
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderSatisfactionTrends(data) {
        const ctx = document.getElementById('satisfactionTrendsChart').getContext('2d');
        
        if (this.charts.satisfactionTrends) {
            this.charts.satisfactionTrends.destroy();
        }

        this.charts.satisfactionTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.date),
                datasets: [{
                    label: 'Daily Satisfaction',
                    data: data.map(d => d.avgSatisfaction),
                    borderColor: '#2b6cb0',
                    backgroundColor: 'rgba(43, 108, 176, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });
    }

    renderAgentTable(data) {
        const tbody = document.getElementById('agentTableBody');
        tbody.innerHTML = data.map(agent => `
            <tr>
                <td><strong>${agent.agentName}</strong><br><small>${agent.agentCode}</small></td>
                <td>${agent.totalCalls}</td>
                <td>${agent.completionRate}%</td>
                <td>${agent.avgCallDuration}s</td>
                <td>
                    <span class="rating-stars">${'★'.repeat(Math.round(agent.customerSatisfaction))}</span>
                    ${agent.customerSatisfaction}
                </td>
                <td>${agent.totalTalkTime}</td>
            </tr>
        `).join('');
    }

    renderSatisfactionTable(data) {
        const tbody = document.getElementById('satisfactionTableBody');
        tbody.innerHTML = data.map(agent => `
            <tr>
                <td><strong>${agent.agentName}</strong></td>
                <td>
                    <span class="rating-stars">${'★'.repeat(Math.round(agent.avgSatisfaction))}</span>
                    ${agent.avgSatisfaction}
                </td>
                <td>${agent.totalRatings}</td>
                <td>${agent.highRatings}</td>
                <td>${agent.lowRatings}</td>
            </tr>
        `).join('');
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        document.querySelector('.container').insertBefore(errorDiv, document.querySelector('.tabs'));
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Tab functionality
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Load reports function
function loadReports() {
    if (window.reportsManager) {
        window.reportsManager.loadReports();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.reportsManager = new CallCenterReports();
});