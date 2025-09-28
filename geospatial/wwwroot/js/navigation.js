// Universal Navigation JavaScript
class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        this.createNavigation();
        this.setupEventListeners();
        this.updateActiveNavigation();
    }

    createNavigation() {
        // Create navigation HTML
        const navHTML = `
            <nav class="top-nav">
                <a href="../index.html" class="nav-brand">
                    <span class="brand-icon">🏢</span>
                    <span class="brand-text">Urban Referral Network</span>
                </a>
                
                <div class="nav-actions">
                    <a href="../pages/dashboard.html" class="nav-btn nav-btn-secondary">
                        <span>📊</span>
                        <span class="btn-text">Dashboard</span>
                    </a>
                    <a href="../pages/contractor-finder.html" class="nav-btn nav-btn-secondary">
                        <span>🔍</span>
                        <span class="btn-text">Find Contractors</span>
                    </a>
                    <a href="../pages/call-center.html" class="nav-btn nav-btn-secondary">
                        <span>📞</span>
                        <span class="btn-text">Call Center</span>
                    </a>
                    <a href="../pages/training-center.html" class="nav-btn nav-btn-primary">
                        <span>🎓</span>
                        <span class="btn-text">Training</span>
                    </a>
                    <button class="nav-menu-toggle" id="navMenuToggle">
                        ☰
                    </button>
                </div>
            </nav>
        `;

        // Insert navigation at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navHTML);
        
        // Add page-content class to main content
        const mainContent = document.querySelector('main, .container, .main-content, body > div:not(.top-nav)');
        if (mainContent && !mainContent.classList.contains('page-content')) {
            mainContent.classList.add('page-content');
        }
    }



    setupEventListeners() {
        // Mobile menu toggle
        const menuToggle = document.getElementById('navMenuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        }

        // Add ripple effect to nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', this.addRippleEffect.bind(this));
        });

        // Handle page navigation
        document.querySelectorAll('.nav-btn[href]').forEach(link => {
            link.addEventListener('click', (e) => {
                // Add loading state
                link.style.opacity = '0.7';
                link.style.pointerEvents = 'none';
                
                // Reset after navigation
                setTimeout(() => {
                    link.style.opacity = '';
                    link.style.pointerEvents = '';
                }, 1000);
            });
        });
    }

    toggleMobileMenu() {
        const navActions = document.querySelector('.nav-actions');
        navActions.classList.toggle('mobile-menu-open');
    }

    addRippleEffect(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: navRipple 0.6s linear;
            pointer-events: none;
        `;

        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    updateActiveNavigation() {
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('.nav-btn[href]');
        
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
            if (linkPage === currentPage) {
                link.classList.add('active');
                link.classList.remove('nav-btn-secondary');
                link.classList.add('nav-btn-primary');
            }
        });
    }

    // Utility method to set page title
    setPageInfo(title) {
        document.title = `${title} - Urban Referral Network`;
    }
}

// Auto-initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
    
    // Add navigation styles
    const navRippleStyle = document.createElement('style');
    navRippleStyle.textContent = `
        @keyframes navRipple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .nav-actions.mobile-menu-open {
            position: fixed;
            top: 60px;
            right: 0;
            left: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(20px);
            flex-direction: column;
            padding: 20px;
            gap: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .nav-actions.mobile-menu-open .nav-btn {
            width: 100%;
            justify-content: center;
            padding: 12px 20px;
        }
        
        .nav-actions.mobile-menu-open .btn-text {
            display: inline !important;
        }
        
        @media (min-width: 769px) {
            .nav-actions.mobile-menu-open {
                position: static;
                background: none;
                flex-direction: row;
                padding: 0 24px;
                border: none;
            }
        }
    `;
    document.head.appendChild(navRippleStyle);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}