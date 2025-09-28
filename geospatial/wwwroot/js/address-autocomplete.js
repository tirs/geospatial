/**
 * Address Auto-Complete Component
 * Provides address suggestions and auto-population without third-party services
 */
class AddressAutoComplete {
    constructor(options) {
        this.inputElement = options.inputElement;
        this.zipCodeElement = options.zipCodeElement;
        this.cityElement = options.cityElement;
        this.stateElement = options.stateElement;
        this.countyElement = options.countyElement;
        this.onSelect = options.onSelect || (() => {});
        this.minLength = options.minLength || 2;
        this.maxResults = options.maxResults || 10;
        
        this.suggestionsList = null;
        this.currentFocus = -1;
        this.debounceTimer = null;
        
        this.init();
    }

    init() {
        this.createSuggestionsList();
        this.bindEvents();
    }

    createSuggestionsList() {
        this.suggestionsList = document.createElement('div');
        this.suggestionsList.className = 'address-suggestions';
        this.suggestionsList.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        `;
        
        // Make input container relative
        const container = this.inputElement.parentElement;
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        
        container.appendChild(this.suggestionsList);
    }

    bindEvents() {
        this.inputElement.addEventListener('input', (e) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.handleInput(e.target.value);
            }, 300);
        });

        this.inputElement.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        this.inputElement.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 150);
        });

        document.addEventListener('click', (e) => {
            if (!this.inputElement.contains(e.target) && !this.suggestionsList.contains(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    async handleInput(value) {
        if (value.length < this.minLength) {
            this.hideSuggestions();
            return;
        }

        try {
            const response = await fetch(`/api/address/search?query=${encodeURIComponent(value)}&maxResults=${this.maxResults}`);
            const data = await response.json();
            
            if (data.success && data.results.length > 0) {
                this.showSuggestions(data.results);
            } else {
                this.hideSuggestions();
            }
        } catch (error) {
            console.error('Address search error:', error);
            this.hideSuggestions();
        }
    }

    showSuggestions(results) {
        this.suggestionsList.innerHTML = '';
        this.currentFocus = -1;

        results.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f3f4f6;
                transition: background-color 0.2s;
            `;
            
            item.innerHTML = `
                <div style="font-weight: 500; color: #1f2937;">${result.display}</div>
                <div style="font-size: 0.875rem; color: #6b7280;">
                    ${result.type === 'zipcode' ? 'ZIP Code' : 'City'} • ${result.county} County
                </div>
            `;

            item.addEventListener('mouseenter', () => {
                this.setActiveSuggestion(index);
            });

            item.addEventListener('click', () => {
                this.selectSuggestion(result);
            });

            this.suggestionsList.appendChild(item);
        });

        this.suggestionsList.style.display = 'block';
    }

    hideSuggestions() {
        this.suggestionsList.style.display = 'none';
        this.currentFocus = -1;
    }

    handleKeyDown(e) {
        const items = this.suggestionsList.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.currentFocus = Math.min(this.currentFocus + 1, items.length - 1);
            this.setActiveSuggestion(this.currentFocus);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.currentFocus = Math.max(this.currentFocus - 1, -1);
            this.setActiveSuggestion(this.currentFocus);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.currentFocus >= 0 && items[this.currentFocus]) {
                items[this.currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            this.hideSuggestions();
        }
    }

    setActiveSuggestion(index) {
        const items = this.suggestionsList.querySelectorAll('.suggestion-item');
        
        items.forEach((item, i) => {
            if (i === index) {
                item.style.backgroundColor = '#f3f4f6';
                this.currentFocus = i;
            } else {
                item.style.backgroundColor = 'white';
            }
        });
    }

    async selectSuggestion(result) {
        // Auto-populate fields
        if (this.zipCodeElement) {
            this.zipCodeElement.value = result.zipCode;
            this.zipCodeElement.dispatchEvent(new Event('change'));
        }
        
        if (this.cityElement) {
            this.cityElement.value = result.city;
            this.cityElement.dispatchEvent(new Event('change'));
        }
        
        if (this.stateElement) {
            this.stateElement.value = result.state;
            this.stateElement.dispatchEvent(new Event('change'));
        }
        
        if (this.countyElement) {
            this.countyElement.value = result.county;
            this.countyElement.dispatchEvent(new Event('change'));
        }

        // Update input with formatted address
        this.inputElement.value = result.display;
        
        this.hideSuggestions();
        this.onSelect(result);
    }

    destroy() {
        if (this.suggestionsList) {
            this.suggestionsList.remove();
        }
        clearTimeout(this.debounceTimer);
    }
}

/**
 * ZIP Code Auto-Complete for ZIP code only fields
 */
class ZipCodeAutoComplete {
    constructor(options) {
        this.selectElement = options.selectElement;
        this.onSelect = options.onSelect || (() => {});
        
        this.init();
    }

    async init() {
        await this.loadZipCodes();
        this.bindEvents();
    }

    async loadZipCodes() {
        try {
            const response = await fetch('/api/address/search?query=9&maxResults=100');
            const data = await response.json();
            
            if (data.success) {
                this.populateSelect(data.results);
            }
        } catch (error) {
            console.error('Failed to load ZIP codes:', error);
            this.loadFallbackZipCodes();
        }
    }

    populateSelect(zipCodes) {
        this.selectElement.innerHTML = '<option value="">Select ZIP Code</option>';
        
        zipCodes.forEach(zip => {
            const option = document.createElement('option');
            option.value = zip.zipCode;
            option.textContent = `${zip.zipCode} - ${zip.city}`;
            option.dataset.city = zip.city;
            option.dataset.state = zip.state;
            option.dataset.county = zip.county;
            option.dataset.latitude = zip.latitude;
            option.dataset.longitude = zip.longitude;
            this.selectElement.appendChild(option);
        });
    }

    loadFallbackZipCodes() {
        const fallbackZips = [
            { zipCode: '90210', city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90211', city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90212', city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90401', city: 'Santa Monica', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90402', city: 'Santa Monica', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90403', city: 'Santa Monica', state: 'CA', county: 'Los Angeles' }
        ];
        
        this.populateSelect(fallbackZips);
    }

    bindEvents() {
        this.selectElement.addEventListener('change', (e) => {
            const selectedOption = e.target.selectedOptions[0];
            if (selectedOption && selectedOption.value) {
                const zipData = {
                    zipCode: selectedOption.value,
                    city: selectedOption.dataset.city,
                    state: selectedOption.dataset.state,
                    county: selectedOption.dataset.county,
                    latitude: parseFloat(selectedOption.dataset.latitude),
                    longitude: parseFloat(selectedOption.dataset.longitude)
                };
                
                this.onSelect(zipData);
            }
        });
    }
}

// Export for use in other scripts
window.AddressAutoComplete = AddressAutoComplete;
window.ZipCodeAutoComplete = ZipCodeAutoComplete;