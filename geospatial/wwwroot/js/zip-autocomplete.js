/**
 * Universal ZIP Code Autocomplete System
 * Works with any input field across the entire application
 * Usage: Just add class "zip-autocomplete" to any input field
 */

class ZipAutocomplete {
    constructor() {
        this.cache = new Map();
        this.searchTimeout = null;
        this.currentHighlight = -1;
        this.activeInput = null;
        this.activeSuggestions = null;
        
        this.init();
    }

    init() {
        // Auto-initialize all ZIP inputs on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeAllZipInputs();
        });

        // Watch for dynamically added inputs
        this.observeNewInputs();
        
        // Global click handler to hide suggestions
        document.addEventListener('click', (e) => {
            if (!this.isAutocompleteElement(e.target)) {
                this.hideSuggestions();
            }
        });
    }

    initializeAllZipInputs() {
        // Find all ZIP inputs by class, ID patterns, or name patterns
        const selectors = [
            '.zip-autocomplete',
            'input[name*="zip"]',
            'input[id*="zip"]',
            'input[name*="postal"]',
            'input[id*="postal"]',
            'input[placeholder*="ZIP"]',
            'input[placeholder*="zip"]'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(input => {
                this.setupZipInput(input);
            });
        });
    }

    observeNewInputs() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if the added node is a ZIP input
                        if (this.isZipInput(node)) {
                            this.setupZipInput(node);
                        }
                        // Check for ZIP inputs within the added node
                        node.querySelectorAll && node.querySelectorAll('input').forEach(input => {
                            if (this.isZipInput(input)) {
                                this.setupZipInput(input);
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    isZipInput(input) {
        if (!input || input.tagName !== 'INPUT') return false;
        
        const patterns = [
            /zip/i,
            /postal/i
        ];

        return patterns.some(pattern => 
            pattern.test(input.name || '') ||
            pattern.test(input.id || '') ||
            pattern.test(input.placeholder || '') ||
            input.classList.contains('zip-autocomplete')
        );
    }

    setupZipInput(input) {
        // Avoid double initialization
        if (input.dataset.zipAutocompleteInit) return;
        input.dataset.zipAutocompleteInit = 'true';

        // Create container and suggestions div
        this.createAutocompleteStructure(input);

        // Add event listeners
        this.addEventListeners(input);

        console.log('✅ ZIP autocomplete initialized for:', input.id || input.name || 'unnamed input');
    }

    createAutocompleteStructure(input) {
        // Wrap input in container if not already wrapped
        if (!input.parentElement.classList.contains('zip-autocomplete-container')) {
            const container = document.createElement('div');
            container.className = 'zip-autocomplete-container';
            input.parentNode.insertBefore(container, input);
            container.appendChild(input);
        }

        // Create suggestions div
        const suggestionsId = `zip-suggestions-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.id = suggestionsId;
        suggestionsDiv.className = 'zip-suggestions';
        input.parentElement.appendChild(suggestionsDiv);

        // Store reference
        input.dataset.suggestionsId = suggestionsId;

        // Add CSS if not already added
        this.addCSS();
    }

    addEventListeners(input) {
        input.addEventListener('input', (e) => this.handleInput(e));
        input.addEventListener('keydown', (e) => this.handleKeydown(e));
        input.addEventListener('focus', (e) => this.handleFocus(e));
        input.addEventListener('blur', (e) => this.handleBlur(e));
    }

    handleInput(e) {
        const input = e.target;
        const query = input.value.trim();

        clearTimeout(this.searchTimeout);

        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.searchZipCodes(query, input);
        }, 300);
    }

    handleKeydown(e) {
        const input = e.target;
        const suggestionsDiv = document.getElementById(input.dataset.suggestionsId);
        const suggestions = suggestionsDiv.querySelectorAll('.zip-suggestion');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.currentHighlight = Math.min(this.currentHighlight + 1, suggestions.length - 1);
                this.updateHighlight(suggestions);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.currentHighlight = Math.max(this.currentHighlight - 1, -1);
                this.updateHighlight(suggestions);
                break;
            case 'Enter':
                e.preventDefault();
                if (this.currentHighlight >= 0 && suggestions[this.currentHighlight]) {
                    this.selectZipCode(suggestions[this.currentHighlight], input);
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    handleFocus(e) {
        this.activeInput = e.target;
    }

    handleBlur(e) {
        // Delay hiding to allow for clicks on suggestions
        setTimeout(() => {
            if (this.activeInput === e.target) {
                this.hideSuggestions();
            }
        }, 150);
    }

    async searchZipCodes(query, input) {
        try {
            // Check cache first
            const cacheKey = query.toLowerCase();
            if (this.cache.has(cacheKey)) {
                this.displaySuggestions(this.cache.get(cacheKey), input);
                return;
            }

            // Make API call
            const response = await fetch(`/api/zipcode/search?q=${encodeURIComponent(query)}&limit=8`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const results = await response.json();
            
            // Cache results
            this.cache.set(cacheKey, results);
            
            this.displaySuggestions(results, input);
        } catch (error) {
            console.error('ZIP search error:', error);
            // Fallback to mock data
            const results = await this.mockZipSearch(query);
            this.displaySuggestions(results, input);
        }
    }

    displaySuggestions(results, input) {
        const suggestionsDiv = document.getElementById(input.dataset.suggestionsId);
        
        if (results.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestionsDiv.innerHTML = '';
        this.currentHighlight = -1;
        this.activeSuggestions = suggestionsDiv;

        results.forEach((zip, index) => {
            const div = document.createElement('div');
            div.className = 'zip-suggestion';
            div.innerHTML = `
                <div class="zip-code">${zip.zipCode}</div>
                <div class="zip-location">${zip.city}, ${zip.state}</div>
            `;
            
            div.addEventListener('click', () => this.selectZipCode(div, input));
            div.dataset.zipCode = zip.zipCode;
            div.dataset.city = zip.city;
            div.dataset.state = zip.state;
            div.dataset.county = zip.county || 'Los Angeles'; // Default to Los Angeles for LA County
            
            suggestionsDiv.appendChild(div);
        });

        suggestionsDiv.style.display = 'block';
    }

    updateHighlight(suggestions) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('highlighted', index === this.currentHighlight);
        });
    }

    selectZipCode(suggestionElement, input) {
        const zipCode = suggestionElement.dataset.zipCode;
        const city = suggestionElement.dataset.city;
        const state = suggestionElement.dataset.state;
        const county = suggestionElement.dataset.county;

        console.log('🎯 Selecting ZIP Code:', { zipCode, city, state, county });

        // Fill the ZIP input
        input.value = zipCode;

        // Auto-fill related fields
        this.autoFillRelatedFields(input, { zipCode, city, state, county });

        this.hideSuggestions();
        
        // Trigger change event
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Custom event for other scripts to listen to
        input.dispatchEvent(new CustomEvent('zipSelected', {
            detail: { zipCode, city, state, county },
            bubbles: true
        }));

        console.log('✅ ZIP Code Selected:', { zipCode, city, state, county });
    }

    autoFillRelatedFields(zipInput, data) {
        const form = zipInput.closest('form') || document;
        
        console.log('🔄 Auto-filling related fields with data:', data);
        console.log('🔍 Searching in form:', form);
        
        // Enhanced field patterns to auto-fill
        const fieldMappings = [
            { 
                data: 'city', 
                patterns: ['city', 'town', 'municipality'],
                exactNames: ['customerCity', 'serviceCity', 'callerCity', 'billingCity', 'shippingCity']
            },
            { 
                data: 'state', 
                patterns: ['state', 'province', 'region'],
                exactNames: ['customerState', 'serviceState', 'callerState', 'billingState', 'shippingState']
            },
            { 
                data: 'county', 
                patterns: ['county', 'district'],
                exactNames: ['customerCounty', 'serviceCounty', 'callerCounty']
            }
        ];

        fieldMappings.forEach(mapping => {
            const value = data[mapping.data];
            if (!value) return;

            // First try exact name matches
            mapping.exactNames.forEach(exactName => {
                const selector = `input[name="${exactName}"], input[id="${exactName}"], select[name="${exactName}"], select[id="${exactName}"]`;
                const field = form.querySelector(selector);
                console.log(`🔍 Looking for ${exactName} with selector: ${selector}`);
                console.log(`🎯 Found field:`, field);
                
                if (field && field !== zipInput) {
                    field.value = value;
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ Auto-filled ${exactName}: ${value}`);
                } else if (!field) {
                    console.log(`❌ Field ${exactName} not found`);
                }
            });

            // Then try pattern matches
            mapping.patterns.forEach(pattern => {
                const selectors = [
                    `input[name*="${pattern}"]`,
                    `input[id*="${pattern}"]`,
                    `select[name*="${pattern}"]`,
                    `select[id*="${pattern}"]`
                ];

                selectors.forEach(selector => {
                    const fields = form.querySelectorAll(selector);
                    fields.forEach(field => {
                        if (field !== zipInput && !field.value) {
                            field.value = value;
                            field.dispatchEvent(new Event('change', { bubbles: true }));
                            console.log(`✅ Auto-filled ${field.name || field.id}: ${value}`);
                        }
                    });
                });
            });
        });
    }

    hideSuggestions() {
        if (this.activeSuggestions) {
            this.activeSuggestions.style.display = 'none';
            this.activeSuggestions = null;
        }
        this.currentHighlight = -1;
        this.activeInput = null;
    }

    isAutocompleteElement(element) {
        return element.closest('.zip-autocomplete-container') !== null;
    }

    addCSS() {
        if (document.getElementById('zip-autocomplete-styles')) return;

        const style = document.createElement('style');
        style.id = 'zip-autocomplete-styles';
        style.textContent = `
            .zip-autocomplete-container {
                position: relative;
            }

            .zip-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #e2e8f0;
                border-top: none;
                border-radius: 0 0 8px 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
            }

            .zip-suggestion {
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f1f5f9;
                transition: background-color 0.2s;
            }

            .zip-suggestion:hover,
            .zip-suggestion.highlighted {
                background-color: #f8fafc;
            }

            .zip-suggestion:last-child {
                border-bottom: none;
            }

            .zip-code {
                font-weight: 600;
                color: #1e293b;
            }

            .zip-location {
                font-size: 0.9rem;
                color: #64748b;
                margin-top: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    // Mock data fallback
    async mockZipSearch(query) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const mockZips = [
            { zipCode: '90210', city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90211', city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90212', city: 'Beverly Hills', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90401', city: 'Santa Monica', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90402', city: 'Santa Monica', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90403', city: 'Santa Monica', state: 'CA', county: 'Los Angeles' },
            { zipCode: '90404', city: 'Santa Monica', state: 'CA', county: 'Los Angeles' },
            { zipCode: '91001', city: 'Altadena', state: 'CA', county: 'Los Angeles' }
        ];

        return mockZips.filter(zip => 
            zip.zipCode.startsWith(query) || 
            zip.city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8);
    }
}

// Initialize the global ZIP autocomplete system
window.zipAutocomplete = new ZipAutocomplete();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZipAutocomplete;
}