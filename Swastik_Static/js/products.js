import { shopSettings } from "./data.js";
import { products } from "./data.js";

document.addEventListener('DOMContentLoaded', () => {
    const categorySelect = document.getElementById('category-select');
    const sortSelect = document.getElementById('sort-select');

    categorySelect.addEventListener('change', filterProducts);
    sortSelect.addEventListener('change', filterProducts);

    // existing code
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('category')) {
        categorySelect.value = urlParams.get('category');
    }
    filterProducts();
});

function filterProducts() {
    const categorySelect = document.getElementById('category-select');
    const sortSelect = document.getElementById('sort-select');
    const grid = document.getElementById('product-grid');
    const title = document.getElementById('page-title');
    
    const category = categorySelect.value;
    const sort = sortSelect.value;
    
    // Get special 'type' filter from URL (bestsellers, latest)
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');

    if (typeof products === 'undefined') {
        grid.innerHTML = '<p style="padding:2rem; text-align:center;">Loading product data...</p>';
        return;
    }

    let filtered = [...products];
    const searchQuery = urlParams.get('q');
    if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        );
        title.innerText = `Search results for "${searchQuery}"`;
    }
        
    // --- FILTERING LOGIC ---
    function parsePrice(priceStr) {
        if (!priceStr) return 0;
            return Number(priceStr.replace(/[₹,]/g, ""));
    }

    // Case 1: Category Dropdown is Active
    
    if (category) {
        filtered = filtered.filter(p => p.category === category);
        title.innerText = category.charAt(0).toUpperCase() + category.slice(1);
    } 
    // Case 2: Special View - Best Sellers
    else if (type === 'bestsellers') {
        filtered = filtered.filter(p => p.bestseller);
        title.innerText = "Best Sellers";
    } 
    // Case 3: Special View - Latest Arrivals
    else if (type === 'latest') {
        let latest = filtered.filter(p => p.latest_arrival === true);
        if (latest.length === 0) {
            latest = [...filtered].reverse().slice(0, 10);
        }
        filtered = latest;
        title.innerText = "Latest Arrivals";
    } 
    // Case 4: Default - All Products
    else {
        title.innerText = "All Products";
    }

    // --- SORTING LOGIC ---
    if (sort === 'price_asc') {
        filtered.sort((a,b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sort === 'price_desc') {
        filtered.sort((a,b) => parsePrice(b.price) - parsePrice(a.price));
    } else if (sort === 'name_asc') {
        filtered.sort((a,b) => a.name.localeCompare(b.name));
    }

    // --- RENDERING ---
    grid.innerHTML = '';
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:2rem; font-size:1.2rem;">No products found.</p>';
        return;
    }

    filtered.forEach(p => {
        // CHANGE: Create Card Container as DIV instead of A to fix nesting issues
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer'; // Make it look clickable
        
        // Add click listener for navigation to the card itself
        card.addEventListener('click', () => {
            window.location.href = `product.html?id=${p.id}`;
        });
        
        // --- 1. BADGE LOGIC ---
        let badgeHtml = '';
        
        // Calculate Discount logic
        let hasDiscount = false;
        let percentOff = 0;
        
        const currentPrice = parsePrice(p.price);
        const originalPrice = p.original_price ? parsePrice(p.original_price) : 0;
        
        if (originalPrice > currentPrice) {
            hasDiscount = true;
            percentOff = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        }

        // Determine which badge to show
        if (hasDiscount) {
            badgeHtml = '<div class="badge limited">Limited Time Deal</div>';
        } else if (p.bestseller && !type) {
            badgeHtml = '<div class="badge bestseller">Best Seller</div>';
        } else if (p.latest_arrival && !type) {
            badgeHtml = '<div class="badge new">New</div>';
        }

        // --- 2. PRICE LOGIC ---
        let priceHtml = '';
        if (hasDiscount) {
            priceHtml = `
                <div class="price-row discounted">
                    <span class="price-main">₹${currentPrice.toLocaleString()}</span>
                    <span class="price-original">${p.original_price}</span>
                    <span class="price-discount">(${percentOff}% OFF)</span>
                </div>
            `;
        } else {
            priceHtml = `
                <div class="price-row">
                    <span class="price-main">₹${currentPrice.toLocaleString()}</span>
                </div>
            `;
        }

        // --- 3. AVAILABILITY & BUTTONS ---
        const isAvailable = p.available !== false;
        let buttonsHtml = '';
        
        if (isAvailable) {
            // We do NOT add onclick handlers in HTML string here to avoid scope/quote issues.
            // Instead we add specific classes and attach listeners below.
            buttonsHtml = `
                <div class="card-buttons">
                    <button class="btn-cart">
                        Add to Cart
                    </button>
                    <button class="btn-inquire">
                        <i class="fab fa-whatsapp"></i> Inquire
                    </button>
                </div>
            `;
        } else {
            buttonsHtml = `
                <button class="btn-cart disabled" disabled>
                    Out of Stock
                </button>
            `;
        }
        
        card.innerHTML = `
            ${badgeHtml}
            <div class="card-image">
                <img src="${p.image}" alt="${p.name}" loading="lazy">
            </div>
            <div class="card-details">
                <h3 class="product-name">${p.name}</h3>
                ${priceHtml}
                ${buttonsHtml}
            </div>
        `;

        // --- 4. ATTACH EVENT LISTENERS SAFELY ---
        if (isAvailable) {
            const addToCartBtn = card.querySelector('.btn-cart');
            const inquireBtn = card.querySelector('.btn-inquire');

            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Stop bubbling to card navigation
                    addToCart(p.id, addToCartBtn);
                });
            }

            if (inquireBtn) {
                inquireBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Stop bubbling to card navigation
                    
                    const waMsg = `Hello, I'm interested in the ${p.name} (Price: ${p.price}). Is it available?`;
                    // Use shopSettings if available, else default
                    const phone = (typeof shopSettings !== 'undefined' && shopSettings.phone) ? shopSettings.phone : '919002066361'; 
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`, '_blank');
                });
            }
        }

        grid.appendChild(card);
    });
}

function addToCart(id, btnElement) {
    let cart = JSON.parse(localStorage.getItem('swastik_cart')) || [];
    const product = products.find(p => p.id == id);
    const existing = cart.find(i => i.id == id);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({...product, quantity: 1});
    }

    localStorage.setItem('swastik_cart', JSON.stringify(cart));
    
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
    window.dispatchEvent(new Event('cartUpdated'));

    const originalText = btnElement.innerText;
    btnElement.innerText = 'Added ✓';
    btnElement.classList.add('added');
    
    setTimeout(() => {
        btnElement.innerText = originalText;
        btnElement.classList.remove('added');
    }, 1500);
}