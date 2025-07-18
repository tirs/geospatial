/**
 * Geospatial Integration for Urban Referral Network
 * Adds map functionality to existing pages
 */

class GeospatialIntegration {
    constructor() {
        this.apiBase = CONFIG?.API_BASE_URL || '/api';
        this.init();
    }

    init() {
        // Auto-detect page and add appropriate geospatial features
        this.detectPageAndIntegrate();
    }

    detectPageAndIntegrate() {
        const currentPage = window.location.pathname;
        
        if (currentPage.includes('contractor-finder') || currentPage.includes('find-contractors')) {
            this.enhanceContractorFinder();
        }
        
        if (currentPage.includes('contractor-dashboard')) {
            this.enhanceContractorDashboard();
        }
        
        if (currentPage.includes('public-home') || currentPage === '/') {
            this.enhanceHomepage();
        }
        
        if (currentPage.includes('admin-dashboard')) {
            this.enhanceAdminDashboard();
        }
    }

    // Enhance Contractor Finder with Maps
    enhanceContractorFinder() {
        // Add map toggle button to search results
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            this.addMapToggleToResults();
        }

        // Add service area preview to contractor cards
        this.enhanceContractorCards();
    }

    addMapToggleToResults() {
        const resultsHeader = document.querySelector('.results-header');
        if (!resultsHeader) return;

        const mapToggle = document.createElement('button');
        mapToggle.className = 'btn-secondary map-toggle-btn';
        mapToggle.innerHTML = '🗺️ Show Map View';
        mapToggle.onclick = () => this.toggleMapView();
        
        resultsHeader.appendChild(mapToggle);

        // Create map container
        const mapContainer = document.createElement('div');
        mapContainer.id = 'contractorMapView';
        mapContainer.className = 'contractor-map-view';
        mapContainer.style.display = 'none';
        mapContainer.innerHTML = `
            <div class="map-header">
                <h3>Contractor Service Areas</h3>
                <button class="btn-close" onclick="geospatialIntegration.toggleMapView()">✕</button>
            </div>
            <div id="contractorServiceMap" class="service-map-container"></div>
        `;

        const resultsSection = document.getElementById('resultsSection');
        resultsSection.appendChild(mapContainer);
    }

    toggleMapView() {
        const mapView = document.getElementById('contractorMapView');
        const toggleBtn = document.querySelector('.map-toggle-btn');
        
        if (mapView.style.display === 'none') {
            mapView.style.display = 'block';
            toggleBtn.innerHTML = '📋 Show List View';
            this.loadContractorMap();
        } else {
            mapView.style.display = 'none';
            toggleBtn.innerHTML = '🗺️ Show Map View';
        }
    }

    loadContractorMap() {
        const contractorCards = document.querySelectorAll('.contractor-card');
        const contractorIds = Array.from(contractorCards).map(card => 
            parseInt(card.dataset.contractorId)
        ).filter(id => !isNaN(id));

        if (contractorIds.length > 0) {
            const mapContainer = document.getElementById('contractorServiceMap');
            new ServiceAreaMap({
                container: mapContainer,
                contractorIds: contractorIds,
                width: mapContainer.offsetWidth || 800,
                height: 500,
                showZipCodes: true,
                showRadius: true
            });
        }
    }

    enhanceContractorCards() {
        // Add service area preview buttons to contractor cards
        const contractorCards = document.querySelectorAll('.contractor-card');
        
        contractorCards.forEach(card => {
            const contractorId = card.dataset.contractorId;
            if (!contractorId) return;

            const actionsDiv = card.querySelector('.contractor-actions') || 
                              card.querySelector('.select-contractor-btn')?.parentElement;
            
            if (actionsDiv) {
                const mapBtn = document.createElement('button');
                mapBtn.className = 'btn-map-preview';
                mapBtn.innerHTML = '🗺️ View Area';
                mapBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.showContractorAreaPreview(contractorId);
                };
                
                actionsDiv.appendChild(mapBtn);
            }
        });
    }

    showContractorAreaPreview(contractorId) {
        // Create modal for service area preview
        const modal = document.createElement('div');
        modal.className = 'service-area-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Service Area Preview</h3>
                    <button class="btn-close" onclick="this.closest('.service-area-modal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div id="previewMap${contractorId}" class="preview-map-container"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Load service area map
        const mapContainer = document.getElementById(`previewMap${contractorId}`);
        new ServiceAreaMap({
            container: mapContainer,
            contractorId: parseInt(contractorId),
            width: 600,
            height: 400,
            showZipCodes: true,
            showRadius: true
        });
    }

    // Enhance Contractor Dashboard
    enhanceContractorDashboard() {
        // Add service area widget to dashboard
        this.addServiceAreaWidget();
    }

    addServiceAreaWidget() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (!dashboardGrid) return;

        const serviceAreaWidget = document.createElement('div');
        serviceAreaWidget.className = 'dashboard-card service-area-widget';
        serviceAreaWidget.innerHTML = `
            <div class="card-header">
                <h3>🗺️ Your Service Area</h3>
                <button class="btn-secondary" onclick="geospatialIntegration.openServiceAreaManager()">
                    Manage Area
                </button>
            </div>
            <div class="card-content">
                <div id="dashboardServiceMap" class="dashboard-map-container"></div>
                <div class="service-stats">
                    <div class="stat-item">
                        <span class="stat-value" id="coverageZipCodes">-</span>
                        <span class="stat-label">ZIP Codes</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value" id="serviceRadius">-</span>
                        <span class="stat-label">Mile Radius</span>
                    </div>
                </div>
            </div>
        `;

        dashboardGrid.appendChild(serviceAreaWidget);
        this.loadDashboardServiceArea();
    }

    async loadDashboardServiceArea() {
        const contractorId = localStorage.getItem('contractorId');
        if (!contractorId) return;

        try {
            const mapContainer = document.getElementById('dashboardServiceMap');
            if (mapContainer) {
                new ServiceAreaMap({
                    container: mapContainer,
                    contractorId: parseInt(contractorId),
                    width: mapContainer.offsetWidth || 400,
                    height: 250,
                    showZipCodes: false,
                    showRadius: true
                });
            }

            // Load service area stats
            const response = await fetch(`${this.apiBase}/servicearea/contractor/${contractorId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const zipCodesEl = document.getElementById('coverageZipCodes');
                    const radiusEl = document.getElementById('serviceRadius');
                    
                    if (zipCodesEl) zipCodesEl.textContent = data.serviceArea.serviceZipCodes.length;
                    if (radiusEl) radiusEl.textContent = `${data.serviceArea.serviceRadius}mi`;
                }
            }
        } catch (error) {
            console.error('Failed to load service area:', error);
        }
    }

    openServiceAreaManager() {
        // Redirect to service area management page or open modal
        window.location.href = '/pages/contractor-dashboard.html#service-area';
    }

    // Enhance Homepage
    enhanceHomepage() {
        this.addHomepageCoverageMap();
    }

    addHomepageCoverageMap() {
        // Look for a suitable container on homepage
        const heroSection = document.querySelector('.hero');
        const featuresSection = document.querySelector('.features');
        
        if (heroSection || featuresSection) {
            this.createCoverageSection();
        }
    }

    createCoverageSection() {
        const coverageSection = document.createElement('section');
        coverageSection.className = 'coverage-section';
        coverageSection.innerHTML = `
            <div class="container">
                <div class="coverage-header">
                    <h2>🗺️ Our Service Coverage</h2>
                    <p>See where our verified contractors are available to serve you</p>
                </div>
                <div class="coverage-map-container">
                    <div id="homepageCoverageMap" class="homepage-coverage-map"></div>
                    <div class="coverage-stats">
                        <div class="coverage-stat">
                            <span class="stat-number" id="totalContractors">150+</span>
                            <span class="stat-label">Active Contractors</span>
                        </div>
                        <div class="coverage-stat">
                            <span class="stat-number" id="coverageAreas">25+</span>
                            <span class="stat-label">Service Areas</span>
                        </div>
                        <div class="coverage-stat">
                            <span class="stat-number" id="zipCodesCovered">200+</span>
                            <span class="stat-label">ZIP Codes</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert after hero section
        const heroSection = document.querySelector('.hero');
        if (heroSection && heroSection.nextElementSibling) {
            heroSection.parentNode.insertBefore(coverageSection, heroSection.nextElementSibling);
        } else if (heroSection) {
            heroSection.parentNode.appendChild(coverageSection);
        }

        this.loadHomepageCoverageMap();
    }

    async loadHomepageCoverageMap() {
        try {
            // Get active contractors for coverage map
            const response = await fetch(`${this.apiBase}/contractor/active`);
            if (response.ok) {
                const data = await response.json();
                const contractorIds = data.contractors?.slice(0, 10).map(c => c.contractorId) || [];

                if (contractorIds.length > 0) {
                    const mapContainer = document.getElementById('homepageCoverageMap');
                    if (mapContainer) {
                        new ServiceAreaMap({
                            container: mapContainer,
                            contractorIds: contractorIds,
                            width: mapContainer.offsetWidth || 800,
                            height: 400,
                            showZipCodes: true,
                            showRadius: true
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load coverage map:', error);
        }
    }

    // Enhance Admin Dashboard
    enhanceAdminDashboard() {
        this.addGeospatialAnalytics();
    }

    addGeospatialAnalytics() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        if (!dashboardGrid) return;

        const geoAnalyticsWidget = document.createElement('div');
        geoAnalyticsWidget.className = 'dashboard-card geo-analytics-widget';
        geoAnalyticsWidget.innerHTML = `
            <div class="card-header">
                <h3>🌍 Geographic Analytics</h3>
                <select id="geoMetricSelect">
                    <option value="coverage">Coverage Areas</option>
                    <option value="density">Contractor Density</option>
                    <option value="requests">Request Heatmap</option>
                </select>
            </div>
            <div class="card-content">
                <div id="adminGeoMap" class="admin-geo-map"></div>
                <div class="geo-insights">
                    <div class="insight-item">
                        <span class="insight-label">Coverage Gaps:</span>
                        <span class="insight-value" id="coverageGaps">Analyzing...</span>
                    </div>
                    <div class="insight-item">
                        <span class="insight-label">High Demand Areas:</span>
                        <span class="insight-value" id="highDemandAreas">Loading...</span>
                    </div>
                </div>
            </div>
        `;

        dashboardGrid.appendChild(geoAnalyticsWidget);
        this.loadAdminGeoAnalytics();
    }

    async loadAdminGeoAnalytics() {
        // Load comprehensive geospatial analytics for admin
        try {
            const response = await fetch(`${this.apiBase}/admin/geo-analytics`);
            if (response.ok) {
                const data = await response.json();
                // Process and display analytics data
                this.displayGeoAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to load geo analytics:', error);
        }
    }

    displayGeoAnalytics(data) {
        // Display geographic analytics data
        const gapsEl = document.getElementById('coverageGaps');
        const demandEl = document.getElementById('highDemandAreas');
        
        if (gapsEl && data.coverageGaps) {
            gapsEl.textContent = `${data.coverageGaps.length} areas identified`;
        }
        
        if (demandEl && data.highDemandAreas) {
            demandEl.textContent = data.highDemandAreas.slice(0, 3).join(', ');
        }
    }
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.geospatialIntegration = new GeospatialIntegration();
});

// Add required CSS styles
const geospatialStyles = `
<style>
/* Geospatial Integration Styles */
.map-toggle-btn {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
}

.contractor-map-view {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    margin-top: 24px;
    overflow: hidden;
}

.map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
}

.service-map-container {
    height: 500px;
    width: 100%;
}

.btn-map-preview {
    background: #3182ce;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    margin-left: 8px;
    transition: background 0.2s;
}

.btn-map-preview:hover {
    background: #2c5aa0;
}

.service-area-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
}

.modal-content {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
    max-width: 700px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    position: relative;
    z-index: 1;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e5e7eb;
}

.modal-body {
    padding: 20px;
}

.preview-map-container {
    height: 400px;
    width: 100%;
    border-radius: 8px;
    overflow: hidden;
}

.btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
}

.btn-close:hover {
    color: #374151;
}

/* Service Area Widget */
.service-area-widget .dashboard-map-container {
    height: 250px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 16px;
}

.service-stats {
    display: flex;
    gap: 24px;
    justify-content: center;
}

.service-stats .stat-item {
    text-align: center;
}

.service-stats .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a365d;
}

.service-stats .stat-label {
    font-size: 0.875rem;
    color: #6b7280;
}

/* Coverage Section */
.coverage-section {
    padding: 80px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.coverage-header {
    text-align: center;
    margin-bottom: 48px;
}

.coverage-header h2 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1a365d;
    margin-bottom: 16px;
}

.coverage-header p {
    font-size: 1.2rem;
    color: #4b5563;
}

.coverage-map-container {
    background: white;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
}

.homepage-coverage-map {
    height: 400px;
    border-radius: 12px;
    margin-bottom: 32px;
}

.coverage-stats {
    display: flex;
    justify-content: space-around;
    gap: 24px;
}

.coverage-stat {
    text-align: center;
}

.coverage-stat .stat-number {
    display: block;
    font-size: 2rem;
    font-weight: 800;
    color: #1a365d;
    margin-bottom: 8px;
}

.coverage-stat .stat-label {
    font-size: 1rem;
    color: #6b7280;
}

/* Admin Geo Analytics */
.geo-analytics-widget .admin-geo-map {
    height: 300px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 16px;
}

.geo-insights {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.insight-item {
    display: flex;
    justify-content: space-between;
    padding: 12px;
    background: #f8fafc;
    border-radius: 6px;
}

.insight-label {
    font-weight: 500;
    color: #374151;
}

.insight-value {
    color: #1a365d;
    font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
    .coverage-stats {
        flex-direction: column;
        gap: 16px;
    }
    
    .service-stats {
        flex-direction: column;
        gap: 12px;
    }
    
    .modal-content {
        width: 95%;
        margin: 20px;
    }
    
    .preview-map-container {
        height: 300px;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', geospatialStyles);