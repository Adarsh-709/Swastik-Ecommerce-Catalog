import { shopSettings } from "./data.js";
import { products } from "./data.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. DYNAMIC SHOP SETTINGS INJECTION
    if (typeof shopSettings !== 'undefined') {
        const textElements = {
            '.shop-name-text': shopSettings.shopName,
            '.shop-phone-text': shopSettings.displayPhone,
            '.shop-address-text': shopSettings.address,
            '.shop-email-text': shopSettings.email,
            '.shop-time-text': shopSettings.access_time,
            '.copyright_year': shopSettings.copyright_year,
            '.copyright_name': shopSettings.shopName,
        };

        document.getElementById("shopLogo").src = shopSettings.shopLogo;
        document.getElementById("shopName").innerText = shopSettings.shopName;
        document.getElementById("footerName").innerText = shopSettings.shopName;
        document.getElementById("fb_url").href = shopSettings.fb_url;
        document.getElementById("yt_url").href = shopSettings.yt_url;
        document.getElementById("wa_url").href = shopSettings.wa_url;
        document.getElementById("footer_mapurl").href = shopSettings.mapUrl;


        for (const [selector, value] of Object.entries(textElements)) {
            document.querySelectorAll(selector).forEach(el => el.textContent = value);
        }
        const message = "Hello I Would Like To Inquire About Your Products!";
        const waMsg = `*New Inquiry from Website*\n` +
                        `\nMessage: ${message}`;
        // Update WhatsApp Links
        document.querySelectorAll('.wa-link-dynamic').forEach(el => {
            el.href = `https://wa.me/${shopSettings.phone}?text=${encodeURIComponent(waMsg)}"`;
        });
    }

    // 2. MOBILE MENU TOGGLE
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Change icon from menu to close
            const icon = hamburger.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.textContent = 'close';
            } else {
                icon.textContent = 'menu';
            }
        });
    }

    // 3. MOBILE SEARCH TOGGLE
    const searchIcon = document.getElementById('search-icon');
    const searchContainer = document.querySelector('.search-container');
    
    if (searchIcon && searchContainer) {
        searchIcon.addEventListener('click', () => {
            searchContainer.classList.toggle('active');
            // Auto focus input when opening
            if(searchContainer.classList.contains('active')) {
                const input = searchContainer.querySelector('input');
                if(input) setTimeout(() => input.focus(), 100);
            }
        });
    }

    // 4. CART COUNT MANAGEMENT & FLOATING BUTTON
    createFloatingCart(); // Initialize button
    updateCartCount(); // Update counts
    
    window.addEventListener('storage', updateCartCount); // Sync across tabs
    window.addEventListener('cartUpdated', updateCartCount); // Sync on button click

    // 5. LIVE SEARCH SUGGESTIONS
    setupLiveSearch();
});

// Global Search Handler (Form Submission)
window.handleSearch = function(event) {
    event.preventDefault();
    
    const input = event.target.querySelector('input[type="text"]');
    const query = input.value.trim();

    if (query.length > 0) {
        window.location.href = `products.html?q=${encodeURIComponent(query)}`;
    }
};

function createFloatingCart() {
    // Only create if it doesn't exist
    if (!document.getElementById('floating-cart')) {
        const btn = document.createElement('a');
        btn.id = 'floating-cart';
        btn.href = 'cart.html';
        btn.className = 'floating-cart-btn';
        btn.style.display = 'none'; // Hidden by default until items added
        
        btn.innerHTML = `
            <i class="material-icons">shopping_bag</i>
            <span id="float-cart-count" class="float-badge">0</span>
        `;
        
        document.body.appendChild(btn);
    }
}

function updateCartCount() {
    const navBadge = document.getElementById('cart-count');
    const floatBtn = document.getElementById('floating-cart');
    const floatBadge = document.getElementById('float-cart-count');
    
    const cart = JSON.parse(localStorage.getItem('swastik_cart')) || [];
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Update Navbar Badge
    if (navBadge) {
        navBadge.innerText = total;
        navBadge.style.display = total > 0 ? 'inline-flex' : 'none';
    }

    // Update Floating Button
    if (floatBtn && floatBadge) {
        floatBadge.innerText = total;
        if (total > 0) {
            floatBtn.style.display = 'flex';
            // Add a small pop animation
            floatBtn.classList.add('pop');
            setTimeout(() => floatBtn.classList.remove('pop'), 300);
        } else {
            floatBtn.style.display = 'none';
        }
    }
}

// Price Parser Helper
function parsePrice(str) {
    if(!str) return 0;
    return parseFloat(str.toString().replace(/[^0-9.]/g, '')) || 0;
}

// Live Search Setup Function
function setupLiveSearch() {
    const searchInputs = document.querySelectorAll('.search-bar input, .search-container input');

    searchInputs.forEach(input => {
        // Create suggestion box for this input if it doesn't exist
        const form = input.closest('form');
        let suggestionBox = form.querySelector('.search-suggestions');
        
        if (!suggestionBox) {
            suggestionBox = document.createElement('div');
            suggestionBox.className = 'search-suggestions';
            form.style.position = 'relative'; // Ensure relative positioning for absolute suggestions
            form.appendChild(suggestionBox);
        }

        // Input Event Listener
        input.addEventListener('input', () => {
            const query = input.value.trim().toLowerCase();
            
            if (query.length < 1) {
                suggestionBox.style.display = 'none';
                return;
            }

            // Filter Products
            if (typeof products !== 'undefined') {
                const matches = products.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    p.category.toLowerCase().includes(query)
                ).slice(0, 5); // Limit to 5 suggestions

                if (matches.length > 0) {
                    suggestionBox.innerHTML = matches.map(p => `
                        <a href="product.html?id=${p.id}" class="suggestion-item">
                            <img src="${p.image}" alt="${p.name}">
                            <div class="suggestion-info">
                                <span class="suggestion-name">${p.name}</span>
                                <span class="suggestion-price">${p.price}</span>
                            </div>
                        </a>
                    `).join('');
                    suggestionBox.style.display = 'block';
                } else {
                    suggestionBox.innerHTML = '<div class="no-suggestions">No matches found</div>';
                    suggestionBox.style.display = 'block';
                }
            }
        });

        // Hide when clicking outside
        document.addEventListener('click', (e) => {
            if (!form.contains(e.target)) {
                suggestionBox.style.display = 'none';
            }
        });
    });
}