import { shopSettings } from "./data.js";
import { products } from "./data.js";

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') ? params.get('q').trim().toLowerCase() : '';
    
    const title = document.getElementById('search-title');
    const meta = document.getElementById('search-meta');
    const grid = document.getElementById('search-grid');

    // Set input value if existing
    const searchInputs = document.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
        if(query) input.value = query; // Restore search term in box
    });

    if (!query) {
        title.innerText = "Search";
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding:2rem;">Please enter a search term.</p>';
        return;
    }

    title.innerText = `Results for "${query}"`;

    // Filter Products
    if (typeof products === 'undefined') {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:red;">Error: Product data not loaded.</p>';
        return;
    }

    const results = products.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const catMatch = p.category.toLowerCase().includes(query);
        return nameMatch || catMatch;
    });

    meta.innerText = `${results.length} product(s) found`;

    // Render Results
    grid.innerHTML = '';

    if (results.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:4rem 1rem;">
                <i class="material-icons" style="font-size:4rem; color:#ccc; margin-bottom:1rem;">search_off</i>
                <h3>No products found</h3>
                <p style="color:#666;">Try checking your spelling or use different keywords.</p>
                <a href="products.html" class="cta-button" style="margin-top:1rem;">Browse All Products</a>
            </div>
        `;
        return;
    }

    results.forEach(p => {
        // --- LOGIC COPIED FROM products.js for consistency ---
        const currentPrice = parsePrice(p.price);
        const originalPrice = p.original_price ? parsePrice(p.original_price) : 0;
        
        let hasDiscount = false;
        let percentOff = 0;
        if (originalPrice > currentPrice) {
            hasDiscount = true;
            percentOff = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        }

        // Badge
        let badgeHtml = '';
        if (hasDiscount) {
            badgeHtml = '<div class="badge limited">Limited Time Deal</div>';
        } else if (p.bestseller) {
            badgeHtml = '<div class="badge bestseller">Best Seller</div>';
        } else if (p.latest_arrival) {
            badgeHtml = '<div class="badge new">New</div>';
        }

        // Price HTML
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

        // Buttons
        const isAvailable = p.available !== false;
        let buttonsHtml = '';
        if (isAvailable) {
            buttonsHtml = `
                <div class="card-buttons">
                    <button class="btn-cart">Add to Cart</button>
                    <button class="btn-inquire"><i class="fab fa-whatsapp"></i> Inquire</button>
                </div>
            `;
        } else {
            buttonsHtml = `<button class="btn-cart disabled" disabled>Out of Stock</button>`;
        }

        // Create Element
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => { window.location.href = `product.html?id=${p.id}`; });

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

        // Attach Events
        if (isAvailable) {
            const cartBtn = card.querySelector('.btn-cart');
            const inqBtn = card.querySelector('.btn-inquire');
            
            if(cartBtn) {
                cartBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Assuming addToCart is available globally from product.js or defined here
                    // Since we included products.js in HTML (optional) or common.js doesn't have it.
                    // We must define addToCart logic or call it if available.
                    if (typeof addToCart === 'function') addToCart(p.id, cartBtn);
                    else localAddToCart(p.id, cartBtn);
                });
            }
            if(inqBtn) {
                inqBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const msg = `Hello, I saw this on search: ${p.name}. Is it available?`;
                    window.open(`https://wa.me/${shopSettings.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                });
            }
        }

        grid.appendChild(card);
    });
});

// Local Add To Cart fallback if products.js isn't loaded
function localAddToCart(id, btn) {
    let cart = JSON.parse(localStorage.getItem('swastik_cart')) || [];
    const product = products.find(p => p.id == id);
    const existing = cart.find(i => i.id == id);
    if (existing) existing.quantity++;
    else cart.push({...product, quantity: 1});
    
    localStorage.setItem('swastik_cart', JSON.stringify(cart));
    if (typeof updateCartCount === 'function') updateCartCount();
    window.dispatchEvent(new Event('cartUpdated'));

    btn.innerText = "Added";
    setTimeout(() => btn.innerText = "Add to Cart", 1500);
}