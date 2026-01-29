class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const product = JSON.parse(this.getAttribute('data-product'));
        
        // Handle availability check (default to true if field is missing)
        const isAvailable = product.available !== false; 

        // Helper to parse price
        const parsePrice = (priceStr) => {
            if (!priceStr) return 0;
            return parseFloat(priceStr.toString().replace(/[^0-9.]/g, ''));
        };

        // Helper to optimize Cloudinary Images
        const getOptimizedImage = (url) => {
            if (url && url.includes('cloudinary.com') && url.includes('/upload/')) {
                if (!url.includes('/f_auto') && !url.includes('/w_')) {
                    return url.replace('/upload/', '/upload/c_pad,b_white,f_auto,q_auto,w_500/');
                }
            }
            return url;
        };

        const imageUrl = getOptimizedImage(product.image);

        // Price Logic
        let priceHtml = '';
        
        if (isAvailable) {
            priceHtml = `
                <div class="price-block">
                    <span class="currency">₹</span><span class="price-main">${parsePrice(product.price).toLocaleString()}</span>
                </div>
            `;
        } else {
            priceHtml = `
                <div class="price-block">
                    <span class="unavailable-text">Currently Unavailable</span>
                </div>
            `;
        }
        
        let dealBadge = '';
        let discountHtml = '';
        let bestSellerBadge = '';
        let unavailableOverlay = '';

        // Unavailable Logic
        if (!isAvailable) {
            // Optional: Keep overlay but text is now in price area too
            unavailableOverlay = `
                <div class="unavailable-overlay">
                    <span>Out of Stock</span>
                </div>
            `;
        }

        // Check for Best Seller Tag
        if (product.bestseller) {
            bestSellerBadge = `<div class="bestseller-badge">#1 Best Seller</div>`;
        }

        // Only show discount logic if available
        if (isAvailable && product.original_price) {
            const original = parsePrice(product.original_price);
            const current = parsePrice(product.price);
            
            if (original > current) {
                const discount = Math.round(((original - current) / original) * 100);
                
                dealBadge = `<div class="deal-badge">Limited time deal</div>`;
                
                priceHtml = `
                    <div class="price-block">
                        <span class="discount-percent">-${discount}%</span>
                        <span class="currency">₹</span><span class="price-main">${current.toLocaleString()}</span>
                    </div>
                `;
                
                discountHtml = `
                    <div class="mrp-block">
                        M.R.P.: <span class="mrp-strike">₹${original.toLocaleString()}</span>
                    </div>
                `;
            }
        }

        const descriptionText = product.description || '';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Arial', sans-serif;
                    height: 100%;
                }

                .product-card {
                    background-color: #fff;
                    border: 1px solid #e7e7e7;
                    border-radius: 8px;
                    overflow: hidden;
                    text-decoration: none;
                    color: inherit;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    transition: box-shadow 0.2s ease;
                    position: relative;
                    box-sizing: border-box;
                    opacity: ${isAvailable ? '1' : '0.9'}; 
                }

                .product-card:hover {
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    border-color: #d5d5d5;
                }
                
                .image-container {
                    width: 100%;
                    padding-top: 100%;
                    position: relative;
                    background-color: #f8f8f8;
                    margin-bottom: 5px;
                }
                
                .product-image {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    padding: 15px;
                    box-sizing: border-box;
                    transition: transform 0.3s ease;
                    filter: ${isAvailable ? 'none' : 'grayscale(100%)'}; 
                }

                ${isAvailable ? `.product-card:hover .product-image { transform: scale(1.05); }` : ''}
                
                /* BADGES */
                .badge-container {
                    position: absolute;
                    top: 10px;
                    left: 0;
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .bestseller-badge {
                    background-color: #C45500;
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 10px 4px 8px;
                    border-top-right-radius: 20px;
                    border-bottom-right-radius: 20px;
                    width: fit-content;
                    box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
                }

                .unavailable-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: rgba(255, 255, 255, 0.5); /* Lighter overlay */
                    z-index: 20;
                    pointer-events: none; /* Allow clicking through to details */
                }

                .unavailable-overlay span {
                    background-color: #555;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-weight: 600;
                    font-size: 12px;
                    text-transform: uppercase;
                }

                .product-info {
                    padding: 0 12px 14px;
                    display: flex;
                    flex-direction: column;
                    flex-grow: 1;
                    width: 100%;
                    box-sizing: border-box;
                }

                .product-name {
                    font-size: 15px;
                    line-height: 1.3;
                    font-weight: 500;
                    color: #0F1111;
                    margin-bottom: 4px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    height: 2.6em;
                }
                
                .product-desc {
                    font-size: 13px;
                    line-height: 1.4;
                    color: #565959;
                    margin-bottom: 8px;
                    display: -webkit-box;
                    -webkit-line-clamp: 1;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .deal-badge {
                    background-color: #CC0C39;
                    color: white;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 6px;
                    border-radius: 2px;
                    width: fit-content;
                    margin-bottom: 4px;
                }

                .price-container-row {
                    display: flex;
                    align-items: baseline;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 8px;
                    min-height: 24px; /* Ensure height consistency even if unavailable */
                }

                .price-block {
                    display: flex;
                    align-items: baseline;
                }
                
                .unavailable-text {
                    color: #CC0C39;
                    font-weight: 700;
                    font-size: 14px;
                }
                
                .discount-percent {
                    font-size: 20px;
                    color: #CC0C39;
                    font-weight: 300;
                    margin-right: 6px;
                }

                .currency {
                    font-size: 13px;
                    position: relative;
                    top: -6px;
                    padding-right: 1px;
                    color: #0F1111;
                    font-weight: 700;
                }

                .price-main {
                    font-size: 24px;
                    font-weight: 700;
                    color: #0F1111;
                }

                .mrp-block {
                    font-size: 12px;
                    color: #565959;
                }

                .mrp-strike {
                    text-decoration: line-through;
                }

                .buttons-container {
                    margin-top: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    width: 100%;
                    box-sizing: border-box;
                }

                .btn {
                    width: 100%;
                    padding: 10px;
                    border-radius: 20px;
                    border: none;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    text-align: center;
                    text-decoration: none;
                    transition: background 0.2s;
                    box-sizing: border-box;
                    display: block;
                }

                .btn-view {
                    background-color: #fff;
                    border: 1px solid #888;
                    color: #0F1111;
                }
                .btn-view:hover {
                    background-color: #f7f7f7;
                }

                .btn-cart {
                    background-color: #FFD814;
                    border: none;
                    color: #0F1111;
                }
                /* Only apply hover if available */
                ${isAvailable ? `.btn-cart:hover { background-color: #F7CA00; }` : ''}
                
                .btn-cart.disabled {
                    background-color: #e0e0e0;
                    color: #999;
                    cursor: not-allowed;
                    border: 1px solid #ccc;
                }

                .btn-cart.added {
                    background-color: #25D366;
                    color: white;
                }
                
                .spacer {
                    flex-grow: 1;
                }

            </style>
            
            <a href="product.html?id=${product.id}" class="product-card">
                <div class="image-container">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                    
                    <div class="badge-container">
                        ${bestSellerBadge}
                    </div>
                    
                    ${unavailableOverlay}
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    ${descriptionText ? `<div class="product-desc">${descriptionText}</div>` : ''}
                    
                    ${dealBadge}
                    
                    <div class="price-container-row">
                        ${priceHtml}
                        ${discountHtml}
                    </div>
                    
                    <div class="spacer"></div>
                    
                    <div class="buttons-container">
                        <span class="btn btn-view">View Details</span>
                        ${isAvailable 
                            ? `<span class="btn btn-cart">Add to Cart</span>`
                            : `<span class="btn btn-cart disabled">Out of Stock</span>`
                        }
                    </div>
                </div>
            </a>
        `;
        
        if (isAvailable) {
            const cartBtn = this.shadowRoot.querySelector('.btn-cart');
            if(cartBtn) {
                cartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.addToCart(product, cartBtn);
                });
            }
        } else {
            // Disabled button does nothing (but link still works for details)
            const cartBtn = this.shadowRoot.querySelector('.btn-cart');
            if(cartBtn) {
                cartBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        }
    }

    addToCart(product, btnElement) {
        let cart = JSON.parse(localStorage.getItem('swastik_cart')) || [];
        const existingItemIndex = cart.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            });
        }

        localStorage.setItem('swastik_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated'));

        const originalText = btnElement.innerText;
        btnElement.innerText = 'Added ✓';
        btnElement.classList.add('added');
        
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.classList.remove('added');
        }, 1500);
    }
}

customElements.define('product-card', ProductCard);