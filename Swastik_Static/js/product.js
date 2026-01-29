import { shopSettings } from "./data.js";
import { products } from "./data.js";

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const container = document.getElementById('product-details-container');
    const relatedGrid = document.getElementById('related-products-grid');
    
    // 1. Fetch Product
    const product = products.find(p => p.id == id);
    
    if (!product) {
        container.innerHTML = '<p style="text-align:center; font-size:1.2rem; padding: 2rem;">Product not found.</p>';
        if(relatedGrid) document.querySelector('.related-products-section').style.display = 'none';
        return;
    }
    function parsePrice(priceStr) {
        if (!priceStr) return 0;
            return Number(priceStr.replace(/[₹,]/g, ""));
    }
    // 2. Render Product Details
    const currentPrice = parsePrice(product.price);
    const originalPrice = product.original_price ? parsePrice(product.original_price) : 0;
    
    let priceHtml = '';
    
    if (originalPrice > currentPrice) {
        const percentOff = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        priceHtml = `
            <div class="price-wrapper">
                <span class="mrp-label">M.R.P.: <span class="original-price">${product.original_price}</span></span>
                <div class="deal-price-row">
                    <span class="deal-label">Deal Price:</span>
                    <span class="current-price">${product.price}</span>
                </div>
                <span class="save-badge">You Save: ${percentOff}%</span>
                <span class="inclusive-tax">Inclusive of all taxes</span>
            </div>
        `;
    } else {
        priceHtml = `
            <div class="price-wrapper">
                <span class="current-price">${product.price}</span>
                <span class="inclusive-tax">Inclusive of all taxes</span>
            </div>
        `;
    }

    const waMsg = `Hello, I'm interested in the ${product.name} (Price: ${product.price}). Is it available?`;

    // --- IMAGE CAROUSEL LOGIC ---
    const productImages = (product.images && product.images.length > 0) ? product.images : [product.image];
    
    let slidesHtml = productImages.map((img, index) => `
        <div class="product-slide ${index === 0 ? 'active' : ''}">
            <img src="${img}" alt="${product.name} - View ${index + 1}" onclick="openModal('${img}')">
        </div>
    `).join('');

    let dotsHtml = '';
    let navButtonsHtml = '';
    
    if (productImages.length > 1) {
        dotsHtml = `<div class="product-dots">
            ${productImages.map((_, index) => `
                <span class="p-dot ${index === 0 ? 'active' : ''}" onclick="switchProductSlide(${index})"></span>
            `).join('')}
        </div>`;
        
        navButtonsHtml = `
            <button class="p-prev" onclick="changeProductSlide(-1)">&#10094;</button>
            <button class="p-next" onclick="changeProductSlide(1)">&#10095;</button>
        `;
    }

    container.innerHTML = `
        <div class="product-gallery">
            <div class="product-slider-container">
                ${slidesHtml}
                ${navButtonsHtml}
            </div>
            ${dotsHtml}
            <div style="text-align:center; margin-top:10px; font-size:0.8rem; color:#666;">
                <i class="material-icons" style="vertical-align:middle; font-size:1rem;">zoom_in</i> Tap image to Zoom
            </div>
        </div>

        <div class="product-info">
            <h1>${product.name}</h1>
            <div class="divider" style="height:1px; background:#eee; margin: 1.5rem 0;"></div>
            <div class="price-container">${priceHtml}</div>
            
            <div class="divider" style="height:1px; background:#eee; margin: 1.5rem 0;"></div>

            <h3 style="font-size:1.1rem; margin-bottom:0.5rem; color:#333;">About this item</h3>
            <p class="description">${product.description}</p>
            
            <div class="specs-box">
                <div class="spec-row">
                    <div class="spec-label">Dimensions</div>
                    <div class="spec-value">${product.dimensions}</div>
                </div>
                <div class="spec-row">
                    <div class="spec-label">Material</div>
                    <div class="spec-value">${product.material}</div>
                </div>
                <div class="spec-row">
                    <div class="spec-label">Category</div>
                    <div class="spec-value" style="text-transform:capitalize;">${product.category}</div>
                </div>
                <div class="spec-row">
                    <div class="spec-label">Availability</div>
                    <div class="spec-value" style="color:${product.available ? '#25D366' : 'red'}; font-weight:600;">
                        ${product.available ? 'In Stock' : 'Out of Stock'}
                    </div>
                </div>
            </div>

            <div class="action-buttons">
                <button class="btn add-to-cart-btn" id="addToCartBtn">
                    <span class="btn-text"><i class="material-icons">shopping_cart</i> Add to Cart</span>
                </button>
                <a href="https://wa.me/${shopSettings.phone}?text=${encodeURIComponent(waMsg)}" target="_blank" class="btn order-button">
                    <i class="fab fa-whatsapp"></i> Buy on WhatsApp
                </a>
            </div>
            
            <div class="trust-badges" style="margin-top:20px; display:flex; gap:15px; font-size:0.8rem; color:#555;">
                <div style="text-align:center;"><i class="material-icons" style="font-size:1.5rem; color:#333;">local_shipping</i><br>Fast Delivery</div>
                <div style="text-align:center;"><i class="material-icons" style="font-size:1.5rem; color:#333;">verified</i><br>Quality Check</div>
                <div style="text-align:center;"><i class="material-icons" style="font-size:1.5rem; color:#333;">support_agent</i><br>24/7 Support</div>
            </div>
        </div>
    `;

    const btn = document.getElementById("addToCartBtn");

    btn.addEventListener("click", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get("id");
        addToCart(id);
    });

    if (productImages.length > 1) {
        initProductSwipe();
        startProductSlideTimer();
        const gallery = document.querySelector('.product-gallery');
        if (gallery) {
            gallery.addEventListener('mouseenter', stopProductSlideTimer);
            gallery.addEventListener('mouseleave', startProductSlideTimer);
            gallery.addEventListener('touchstart', stopProductSlideTimer, {passive: true});
            gallery.addEventListener('touchend', startProductSlideTimer, {passive: true});
        }
    }

    // 3. Render Related Products
    if (relatedGrid) {
        const related = products
            .filter(p => p.category === product.category && p.id !== product.id)
            .slice(0, 15); 

        relatedGrid.className = 'category-grid'; 
        if (related.length === 1) relatedGrid.classList.add('count-1');
        else if (related.length === 2) relatedGrid.classList.add('count-2');
        else if (related.length === 3) relatedGrid.classList.add('count-3');
        else if (related.length === 4) relatedGrid.classList.add('count-4');
        else if (related.length > 4) relatedGrid.classList.add('count-plus');

        if (related.length > 9) relatedGrid.classList.add('desktop-overflow');

        if (related.length > 0) {
            related.forEach(p => {
                const currentPrice = parsePrice(p.price);
                const originalPrice = p.original_price ? parsePrice(p.original_price) : 0;
                let discountHtml = '';
                let priceBlock = `<span class="price">${p.price}</span>`;

                if (originalPrice > currentPrice) {
                    const percentOff = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
                    discountHtml = `<div class="mini-discount-tag">${percentOff}% OFF</div>`;
                    priceBlock = `
                        <span class="original-price">${p.original_price}</span>
                        <span class="price">${p.price}</span>
                    `;
                }

                const card = document.createElement('a');
                card.href = `product.html?id=${p.id}`;
                card.className = 'product-card-mini';
                
                card.innerHTML = `
                    <div class="mini-img-wrapper">
                        ${discountHtml}
                        <img src="${p.image}" alt="${p.name}" loading="lazy">
                    </div>
                    <div class="mini-info">
                        <h3>${p.name}</h3>
                        <div class="mini-price-container">
                            ${priceBlock}
                        </div>
                    </div>
                `;
                relatedGrid.appendChild(card);
            });
        } else {
            const section = document.querySelector('.related-products-section');
            if(section) section.style.display = 'none';
        }
    }
});

// --- CAROUSEL FUNCTIONS ---
let currentProductSlide = 0;
let slideInterval;

function startProductSlideTimer() {
    stopProductSlideTimer();
    slideInterval = setInterval(() => {
        changeProductSlide(1);
    }, 4000);
}

function stopProductSlideTimer() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

window.changeProductSlide = function(n) {
    stopProductSlideTimer();
    const slides = document.querySelectorAll('.product-slide');
    if(slides.length === 0) return;
    
    showProductSlide(currentProductSlide + n);
    startProductSlideTimer();
}

window.switchProductSlide = function(n) {
    stopProductSlideTimer();
    showProductSlide(n);
    startProductSlideTimer();
}

function showProductSlide(n) {
    const slides = document.querySelectorAll('.product-slide');
    const dots = document.querySelectorAll('.p-dot');
    
    if (n >= slides.length) { currentProductSlide = 0; }
    else if (n < 0) { currentProductSlide = slides.length - 1; }
    else { currentProductSlide = n; }

    slides.forEach(slide => slide.classList.remove('active'));
    slides[currentProductSlide].classList.add('active');

    if(dots.length > 0) {
        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentProductSlide].classList.add('active');
    }
}

function initProductSwipe() {
    const slider = document.querySelector('.product-slider-container');
    let touchStartX = 0;
    let touchEndX = 0;

    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleProductSwipe();
        }, { passive: true });
    }

    function handleProductSwipe() {
        if (touchEndX < touchStartX - 50) {
            changeProductSlide(1);
        }
        if (touchEndX > touchStartX + 50) {
            changeProductSlide(-1);
        }
    }
}

// --- GLOBAL FUNCTIONS & ANIMATION LOGIC ---

function addToCart(id) {
    const btn = document.getElementById('addToCartBtn');
    
    // Prevent multiple clicks
    if (btn && (btn.classList.contains('animating') || btn.classList.contains('added'))) return;

    // 1. Logic: Add to storage
    let cart = JSON.parse(localStorage.getItem('swastik_cart')) || [];
    const product = products.find(p => p.id == id);
    const existing = cart.find(i => i.id == id);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({...product, quantity: 1});
    }
    localStorage.setItem('swastik_cart', JSON.stringify(cart));

    // 2. Animation Logic (On Button itself)
    if (btn) {
        // Start "Drop Item" Animation
        btn.classList.add('animating');
        
        // Temporarily replace content with animation elements
        const originalContent = `<span class="btn-text"><i class="material-icons">shopping_cart</i> Add to Cart</span>`;
        
        btn.innerHTML = `
            <span class="anim-cart-icon"><i class="material-icons">shopping_cart</i></span>
            <span class="anim-item-dot"></span>
        `;
        
        // Wait for animation to finish (1.2s), THEN show "Added"
        setTimeout(() => {
            // Update Cart Count (Badge Bounce)
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
            window.dispatchEvent(new Event('cartUpdated'));

            btn.classList.remove('animating');
            btn.classList.add('added');
            btn.innerHTML = `<span class="btn-text"><i class="material-icons">check_circle</i> Added</span>`;
            
            // Reset Button after 2 seconds
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = originalContent;
            }, 2000);

        }, 1200); // 1.2s delay to match CSS animation duration
    } else {
        // Fallback if button not found
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
        window.dispatchEvent(new Event('cartUpdated'));
    }
}

// Modal Functions (Keep existing)
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById("img01");

window.openModal = function(src) {
    if (modal && modalImg) {
        modal.style.display = "block";
        modalImg.src = src;
    }
}

const closeBtn = document.querySelector('.close-modal');
if (closeBtn) {
    closeBtn.onclick = function() { 
        if(modal) modal.style.display = "none";
    }
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}