document.addEventListener('DOMContentLoaded', async () => {
    const productDetailsContainer = document.getElementById('product-details-container');
    const relatedProductsGrid = document.getElementById('related-products-grid');
    
    // Get dynamic phone number from the template (or default if missing)
    const shopData = document.getElementById('shop-data');
    const shopPhone = shopData ? shopData.getAttribute('data-phone') : '919002066361';

    // Modal Elements
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const closeModal = document.querySelector('.close-modal');

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        try {
            // Fetch from Python API instead of direct Firebase
            const response = await fetch(`/api/product/${productId}`);
            
            if (response.ok) {
                const product = await response.json();
                displayProductDetails(product);
                if (product.category) {
                    displayRelatedProducts(product.category, product.id);
                }
            } else {
                productDetailsContainer.innerHTML = '<p class="error-msg">Product not found.</p>';
            }
        } catch (error) {
            console.error("Error getting product details: ", error);
            productDetailsContainer.innerHTML = '<p class="error-msg">Error loading product details.</p>';
        }
    } else {
        productDetailsContainer.innerHTML = '<p class="error-msg">No product selected.</p>';
    }

    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        return parseFloat(priceStr.toString().replace(/[^0-9.]/g, ''));
    }

    function displayProductDetails(product) {
        const description = product.description || 'No description available.';
        const dimensions = product.dimensions || 'N/A';
        const material = product.material || 'N/A';
        
        // Handle Availability
        // Default to true if the field is missing from DB
        const isAvailable = product.available !== false; 

        // Price Logic
        let priceHtml = '';
        let buttonState = '';
        let imageStyle = '';
        let statusHtml = '';

        if (isAvailable) {
            let priceInnerHtml = `<span class="current-price">${product.price}</span>`;
            
            // Discount Logic
            if (product.original_price) {
                const original = parsePrice(product.original_price);
                const current = parsePrice(product.price);
                
                if (original > current) {
                    const discount = Math.round(((original - current) / original) * 100);
                    priceInnerHtml = `
                        <div class="mrp-row">
                            <span class="mrp-label">M.R.P.: </span>
                            <span class="original-price">${product.original_price}</span>
                            <span class="discount-badge">-${discount}% OFF</span>
                        </div>
                        <div class="selling-row">
                            <span class="current-price">${product.price}</span>
                        </div>
                    `;
                }
            }
            priceHtml = `<div class="price-container">${priceInnerHtml}</div>`;
            statusHtml = `<p style="color: #28a745; font-weight: bold; margin-bottom: 1rem;">In Stock</p>`;
        } else {
            // Unavailable State
            priceHtml = `<div class="price-container"><span class="price unavailable">Unavailable</span></div>`;
            statusHtml = `<p style="color: #d32f2f; font-weight: bold; margin-bottom: 1rem;">Currently Unavailable</p>`;
            buttonState = 'disabled style="background-color: #ccc; cursor: not-allowed; pointer-events: none;"';
            imageStyle = 'filter: grayscale(100%); opacity: 0.8;';
        }

        const whatsappMsg = `I'm interested in the ${product.name} (Price: ${product.price})`;

        productDetailsContainer.innerHTML = `
            <div class="product-image" id="main-product-image-container" style="${imageStyle}">
                <img src="${product.image}" alt="${product.name}" id="main-product-image">
            </div>
            <div class="product-info">
                <h1>${product.name}</h1>
                
                ${priceHtml}
                ${statusHtml}
                
                <p class="description">${description}</p>
                <div class="details-grid">
                    <div class="detail-item">
                        <strong>Dimensions</strong>
                        <span>${dimensions}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Material</strong>
                        <span>${material}</span>
                    </div>
                </div>
                <div class="action-buttons">
                    <button id="add-to-cart-btn" class="add-to-cart-btn" ${buttonState}>
                        <i class="material-icons">shopping_cart</i> ${isAvailable ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                    <a href="https://wa.me/${shopPhone}?text=${encodeURIComponent(whatsappMsg)}" class="order-button" target="_blank" ${buttonState}>
                        <i class="fab fa-whatsapp"></i> ${isAvailable ? 'Buy Now' : 'Out of Stock'}
                    </a>
                </div>
            </div>
        `;

        if (isAvailable) {
            document.getElementById('add-to-cart-btn').addEventListener('click', () => addToCart(product));
        }

        // Setup Image Zoom
        const mainImageContainer = document.getElementById('main-product-image-container');
        if (mainImageContainer) {
            mainImageContainer.addEventListener('click', () => {
                modal.style.display = "block";
                modalImg.src = product.image;
                modalImg.classList.remove('zoomed');
            });
        }
    }

    // Modal Interaction
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = "none";
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });
    }

    if (modalImg) {
        modalImg.addEventListener('click', (e) => {
            e.stopPropagation();
            modalImg.classList.toggle('zoomed');
            if(modalImg.classList.contains('zoomed')) {
                const rect = modalImg.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                modalImg.style.transformOrigin = `${x}px ${y}px`;
            } else {
                modalImg.style.transformOrigin = 'center center';
            }
        });
    }

    function addToCart(product) {
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

        const btn = document.getElementById('add-to-cart-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="material-icons">check</i> Added';
        btn.classList.add('added');
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('added');
        }, 2000);
    }

    async function displayRelatedProducts(category, currentProductId) {
        if (!relatedProductsGrid) return;

        try {
            // Updated to fetch from Python API
            const response = await fetch(`/api/products?category=${encodeURIComponent(category)}`);
            if (!response.ok) return;

            const products = await response.json();
            
            // Filter out current product & unavailable items for related section
            const related = products
                .filter(p => String(p.id) !== String(currentProductId) && p.available !== false)
                .slice(0, 4);

            if (related.length === 0) {
                relatedProductsGrid.innerHTML = '<p>No related products found.</p>';
                return;
            }

            related.forEach((product) => {
                const productCard = document.createElement('product-card');
                product.id = String(product.id);
                productCard.setAttribute('data-product', JSON.stringify(product));
                relatedProductsGrid.appendChild(productCard);
            });

        } catch (error) {
            console.error("Error getting related products: ", error);
        }
    }
});