document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const searchIcon = document.getElementById('search-icon');
    const searchContainer = document.querySelector('.search-container');

    // --- MOBILE MENU TOGGLE ---
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    if (searchIcon && searchContainer) {
        searchIcon.addEventListener('click', () => {
            searchContainer.classList.toggle('active');
        });
    }

    // --- LIVE SEARCH SUGGESTIONS ---
    const searchInputs = document.querySelectorAll('input[name="q"]');

    searchInputs.forEach(input => {
        const form = input.closest('form');
        // Ensure the form has a container for suggestions
        let suggestionsBox = form.querySelector('.search-suggestions');
        
        // Safety check: if box doesn't exist in HTML, logic simply won't run for it
        if (!suggestionsBox) return;

        let timeout = null;

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!form.contains(e.target)) {
                suggestionsBox.style.display = 'none';
            }
        });

        input.addEventListener('input', () => {
            const query = input.value.trim();
            
            // Clear previous timeout (debounce)
            clearTimeout(timeout);

            if (query.length < 2) {
                suggestionsBox.innerHTML = '';
                suggestionsBox.style.display = 'none';
                return;
            }

            // Wait 300ms after user stops typing to fetch
            timeout = setTimeout(async () => {
                try {
                    // Fetch max 5 suggestions
                    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
                    
                    if (!response.ok) return;
                    
                    const products = await response.json();

                    if (products.length > 0) {
                        suggestionsBox.innerHTML = products.map(p => `
                            <a href="product.html?id=${p.id}" class="suggestion-item">
                                <img src="${p.image}" alt="${p.name}">
                                <div class="suggestion-info">
                                    <span class="suggestion-name">${p.name}</span>
                                    <span class="suggestion-price">${p.price}</span>
                                </div>
                            </a>
                        `).join('');
                        suggestionsBox.style.display = 'block';
                    } else {
                        suggestionsBox.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                }
            }, 300);
        });
    });

    // --- CART COUNT UPDATE ---
    updateCartCount();

    function updateCartCount() {
        const cartCountElement = document.getElementById('cart-count');
        if (cartCountElement) {
            const cart = JSON.parse(localStorage.getItem('swastik_cart')) || [];
            // Count total quantity, not just array length
            const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
            cartCountElement.textContent = totalItems;
            
            if(totalItems > 0) {
                cartCountElement.style.display = 'inline-flex';
            } else {
                cartCountElement.style.display = 'none';
            }
        }
    }
    
    // Listen for custom event 'cartUpdated' to update count dynamically without reload
    window.addEventListener('cartUpdated', updateCartCount);
});