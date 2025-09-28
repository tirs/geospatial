/**
 * Service Area Map Component
 * Creates visual maps of contractor service areas without third-party services
 */
class ServiceAreaMap {
    constructor(options) {
        this.container = options.container;
        this.contractorId = options.contractorId;
        this.contractorIds = options.contractorIds || [];
        this.width = options.width || 600;
        this.height = options.height || 400;
        this.showZipCodes = options.showZipCodes !== false;
        this.showRadius = options.showRadius !== false;
        this.colors = options.colors || ['#3182ce', '#e53e3e', '#38a169', '#d69e2e', '#805ad5'];
        
        this.svg = null;
        this.serviceAreas = [];
        this.bounds = null;
        
        this.init();
    }

    async init() {
        this.createSVG();
        await this.loadServiceAreas();
        this.renderMap();
    }

    createSVG() {
        this.container.innerHTML = '';
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', this.width);
        this.svg.setAttribute('height', this.height);
        this.svg.style.cssText = `
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
        `;
        
        this.container.appendChild(this.svg);
    }

    async loadServiceAreas() {
        try {
            if (this.contractorId) {
                const response = await fetch(`/api/servicearea/contractor/${this.contractorId}`);
                const data = await response.json();
                
                if (data.success) {
                    this.serviceAreas = [data.serviceArea];
                }
            } else if (this.contractorIds.length > 0) {
                const response = await fetch('/api/servicearea/multiple', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contractorIds: this.contractorIds })
                });
                const data = await response.json();
                
                if (data.success) {
                    this.serviceAreas = data.serviceAreas;
                }
            }
            
            this.calculateBounds();
        } catch (error) {
            console.error('Failed to load service areas:', error);
            this.showError('Failed to load service area data');
        }
    }

    calculateBounds() {
        if (this.serviceAreas.length === 0) return;
        
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;
        
        this.serviceAreas.forEach(area => {
            if (area.bounds.minLat < minLat) minLat = area.bounds.minLat;
            if (area.bounds.maxLat > maxLat) maxLat = area.bounds.maxLat;
            if (area.bounds.minLon < minLon) minLon = area.bounds.minLon;
            if (area.bounds.maxLon > maxLon) maxLon = area.bounds.maxLon;
        });
        
        // Add padding
        const latPadding = (maxLat - minLat) * 0.1;
        const lonPadding = (maxLon - minLon) * 0.1;
        
        this.bounds = {
            minLat: minLat - latPadding,
            maxLat: maxLat + latPadding,
            minLon: minLon - lonPadding,
            maxLon: maxLon + lonPadding
        };
    }

    renderMap() {
        if (!this.bounds || this.serviceAreas.length === 0) {
            this.showError('No service area data available');
            return;
        }
        
        this.svg.innerHTML = '';
        
        // Create coordinate transformation functions
        const latRange = this.bounds.maxLat - this.bounds.minLat;
        const lonRange = this.bounds.maxLon - this.bounds.minLon;
        
        const toX = (lon) => ((lon - this.bounds.minLon) / lonRange) * this.width;
        const toY = (lat) => this.height - ((lat - this.bounds.minLat) / latRange) * this.height;
        
        // Render each service area
        this.serviceAreas.forEach((area, index) => {
            const color = this.colors[index % this.colors.length];
            this.renderServiceArea(area, color, toX, toY);
        });
        
        // Add legend
        this.renderLegend();
    }

    renderServiceArea(area, color, toX, toY) {
        const centerX = toX(area.centerLongitude);
        const centerY = toY(area.centerLatitude);
        
        // Create group for this service area
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'service-area');
        
        // Render service radius circle
        if (this.showRadius) {
            this.renderRadiusCircle(group, area, color, centerX, centerY, toX, toY);
        }
        
        // Render ZIP code points
        if (this.showZipCodes) {
            this.renderZipCodePoints(group, area, color, toX, toY);
        }
        
        // Render center point
        this.renderCenterPoint(group, area, color, centerX, centerY);
        
        this.svg.appendChild(group);
    }

    renderRadiusCircle(group, area, color, centerX, centerY, toX, toY) {
        // Calculate radius in pixels (approximate)
        const radiusMiles = area.serviceRadius;
        const latPerMile = 1 / 69.0; // Approximate
        const radiusPixels = (radiusMiles * latPerMile / (this.bounds.maxLat - this.bounds.minLat)) * this.height;
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', centerX);
        circle.setAttribute('cy', centerY);
        circle.setAttribute('r', radiusPixels);
        circle.setAttribute('fill', color);
        circle.setAttribute('fill-opacity', '0.2');
        circle.setAttribute('stroke', color);
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('stroke-dasharray', '5,5');
        
        group.appendChild(circle);
    }

    renderZipCodePoints(group, area, color, toX, toY) {
        area.serviceZipCodes.forEach(zip => {
            const x = toX(zip.longitude);
            const y = toY(zip.latitude);
            
            const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            point.setAttribute('cx', x);
            point.setAttribute('cy', y);
            point.setAttribute('r', '3');
            point.setAttribute('fill', color);
            point.setAttribute('stroke', 'white');
            point.setAttribute('stroke-width', '1');
            
            // Add tooltip
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = `${zip.zipCode} - ${zip.city} (${zip.distance.toFixed(1)} mi)`;
            point.appendChild(title);
            
            group.appendChild(point);
        });
    }

    renderCenterPoint(group, area, color, centerX, centerY) {
        const center = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        center.setAttribute('cx', centerX);
        center.setAttribute('cy', centerY);
        center.setAttribute('r', '6');
        center.setAttribute('fill', color);
        center.setAttribute('stroke', 'white');
        center.setAttribute('stroke-width', '2');
        
        // Add tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = `${area.companyName} - Service Center`;
        center.appendChild(title);
        
        group.appendChild(center);
    }

    renderLegend() {
        if (this.serviceAreas.length <= 1) return;
        
        const legend = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        legend.setAttribute('class', 'legend');
        
        const legendBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        legendBg.setAttribute('x', this.width - 200);
        legendBg.setAttribute('y', 10);
        legendBg.setAttribute('width', 190);
        legendBg.setAttribute('height', this.serviceAreas.length * 25 + 10);
        legendBg.setAttribute('fill', 'white');
        legendBg.setAttribute('stroke', '#e5e7eb');
        legendBg.setAttribute('rx', '4');
        legend.appendChild(legendBg);
        
        this.serviceAreas.forEach((area, index) => {
            const color = this.colors[index % this.colors.length];
            const y = 25 + (index * 25);
            
            const colorBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            colorBox.setAttribute('x', this.width - 190);
            colorBox.setAttribute('y', y - 8);
            colorBox.setAttribute('width', '12');
            colorBox.setAttribute('height', '12');
            colorBox.setAttribute('fill', color);
            legend.appendChild(colorBox);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', this.width - 170);
            text.setAttribute('y', y);
            text.setAttribute('font-family', 'Inter, sans-serif');
            text.setAttribute('font-size', '12');
            text.setAttribute('fill', '#374151');
            text.textContent = area.companyName.length > 20 
                ? area.companyName.substring(0, 20) + '...' 
                : area.companyName;
            legend.appendChild(text);
        });
        
        this.svg.appendChild(legend);
    }

    showError(message) {
        this.svg.innerHTML = '';
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', this.width / 2);
        text.setAttribute('y', this.height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'Inter, sans-serif');
        text.setAttribute('font-size', '14');
        text.setAttribute('fill', '#6b7280');
        text.textContent = message;
        
        this.svg.appendChild(text);
    }

    async refresh() {
        await this.loadServiceAreas();
        this.renderMap();
    }

    updateContractor(contractorId) {
        this.contractorId = contractorId;
        this.contractorIds = [];
        this.refresh();
    }

    updateContractors(contractorIds) {
        this.contractorIds = contractorIds;
        this.contractorId = null;
        this.refresh();
    }
}

/**
 * Simple Service Area List Component
 */
class ServiceAreaList {
    constructor(options) {
        this.container = options.container;
        this.contractorId = options.contractorId;
        this.onZipCodeClick = options.onZipCodeClick || (() => {});
        
        this.init();
    }

    async init() {
        await this.loadServiceArea();
    }

    async loadServiceArea() {
        try {
            const response = await fetch(`/api/servicearea/contractor/${this.contractorId}`);
            const data = await response.json();
            
            if (data.success) {
                this.renderServiceArea(data.serviceArea);
            } else {
                this.showError('Failed to load service area');
            }
        } catch (error) {
            console.error('Failed to load service area:', error);
            this.showError('Failed to load service area data');
        }
    }

    renderServiceArea(serviceArea) {
        this.container.innerHTML = `
            <div class="service-area-info">
                <h3>${serviceArea.companyName}</h3>
                <p>Service Radius: ${serviceArea.serviceRadius} miles</p>
                <p>Service ZIP Codes: ${serviceArea.serviceZipCodes.length}</p>
            </div>
            <div class="zip-codes-grid">
                ${serviceArea.serviceZipCodes.map(zip => `
                    <div class="zip-code-item" data-zipcode="${zip.zipCode}">
                        <strong>${zip.zipCode}</strong>
                        <div>${zip.city}</div>
                        <small>${zip.distance.toFixed(1)} mi</small>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add click handlers
        this.container.querySelectorAll('.zip-code-item').forEach(item => {
            item.addEventListener('click', () => {
                const zipCode = item.dataset.zipcode;
                this.onZipCodeClick(zipCode);
            });
        });
    }

    showError(message) {
        this.container.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }
}

// Export for use in other scripts
window.ServiceAreaMap = ServiceAreaMap;
window.ServiceAreaList = ServiceAreaList;