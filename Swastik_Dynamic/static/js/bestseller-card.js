class BestsellerCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const product = JSON.parse(this.getAttribute('data-product'));

        // Helper to parse price
        const parsePrice = (priceStr) => {
            if (!priceStr) return 0;
            return parseFloat(priceStr.toString().replace(/[^0-9.]/g, ''));
        };

        // Helper to optimize Cloudinary Images
        // Adds auto-format, auto-quality, and width resizing for better performance
        const getOptimizedImage = (url) => {
            if (url && url.includes('cloudinary.com') && url.includes('/upload/')) {
                // If it doesn't already have specific transformations, add optimization
                if (!url.includes('/f_auto') && !url.includes('/w_')) {
                    return url.replace('/upload/', '/upload/f_auto,q_auto,w_600/');
                }
            }
            return url;
        };

        const imageUrl = getOptimizedImage(product.image);

        // Price Logic
        let priceHtml = `<div class="product-price">${product.price}</div>`;
        
        if (product.original_price) {
            const original = parsePrice(product.original_price);
            const current = parsePrice(product.price);
            
            if (original > current) {
                const discount = Math.round(((original - current) / original) * 100);
                priceHtml = `
                    <div class="discount-row">
                        <span class="original-price">${product.original_price}</span>
                        <span class="discount-badge">${discount}% OFF</span>
                    </div>
                    <div class="product-price">${product.price}</div>
                `;
            }
        }

        this.shadowRoot.innerHTML = `
            <style>
                .bestseller-card {
                    background-color: #fff;
                    border: none;
                    border-radius: 12px;
                    overflow: hidden;
                    text-decoration: none;
                    color: inherit;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
                    transition: transform 0.3s ease;
                    position: relative;
                }
                
                .badge {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background-color: #ffc107;
                    color: #333;
                    padding: 4px 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    border-radius: 20px;
                    z-index: 2;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .product-image-container {
                    width: 100%;
                    height: 250px;
                    overflow: hidden;
                    position: relative;
                    background-color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    transition: transform 0.5s ease;
                    padding: 15px;
                }

                .bestseller-card:hover .product-image {
                    transform: scale(1.05);
                }

                .product-info {
                    padding: 1.5rem;
                    text-align: center;
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }

                .product-name {
                    font-family: 'Poppins', sans-serif;
                    font-weight: 700;
                    font-size: 1.3rem;
                    margin-bottom: 0.5rem;
                    color: #222;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* Price Styling */
                .price-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .discount-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .original-price {
                    font-size: 0.95rem;
                    color: #999;
                    text-decoration: line-through;
                }

                .discount-badge {
                    font-size: 0.8rem;
                    background-color: #e91e63;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 700;
                }

                .product-price {
                    color: #e91e63;
                    font-weight: 600;
                    font-size: 1.3rem;
                }
                
                .view-btn {
                    display: inline-block;
                    margin-top: auto;
                    padding: 8px 20px;
                    background-color: #333;
                    color: #fff;
                    border-radius: 4px;
                    font-size: 0.9rem;
                    text-decoration: none;
                }
            </style>
            <a href="product.html?id=${product.id}" class="bestseller-card">
                <div class="badge">Top Pick</div>
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                </div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="price-container">
                        ${priceHtml}
                    </div>
                    <span class="view-btn">View Details</span>
                </div>
            </a>
        `;
    }
}

customElements.define('bestseller-card', BestsellerCard);