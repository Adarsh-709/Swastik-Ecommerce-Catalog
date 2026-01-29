document.addEventListener('DOMContentLoaded', async () => {
    const categoryTitle = document.getElementById('category-title');
    const productGrid = document.getElementById('product-grid');
    const categorySelect = document.getElementById('category-select');
    const sortSelect = document.getElementById('sort-select');
    
    let allProducts = [];

    let loadingText = document.querySelector('.loading-text');
    if (!loadingText && productGrid) {
        loadingText = document.createElement('p');
        loadingText.className = 'loading-text';
        loadingText.style.textAlign = 'center';
        loadingText.style.width = '100%';
        loadingText.textContent = 'Loading products...';
        productGrid.appendChild(loadingText);
    }

    // --- INITIALIZATION ---
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category') || '';
    const initialSort = urlParams.get('sort') || 'default';
    const productType = urlParams.get('type') || ''; // Check for 'bestsellers'

    if (categorySelect) categorySelect.value = initialCategory;
    if (sortSelect) sortSelect.value = initialSort;

    updateTitle(initialCategory, productType);
    await fetchAndRenderProducts(initialCategory, initialSort, productType);

    // --- EVENT LISTENERS ---
    
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            const newCategory = e.target.value;
            // When filtering by specific category, we usually clear the 'bestsellers' type 
            // unless you want "Bestsellers in Sofas", but for now let's keep it simple.
            updateURL(newCategory, sortSelect.value, ''); 
            updateTitle(newCategory, '');
            fetchAndRenderProducts(newCategory, sortSelect.value, '');
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const currentCategory = categorySelect.value;
            const newSort = e.target.value;
            // Keep the current type (e.g. if viewing bestsellers, keep it)
            updateURL(currentCategory, newSort, productType);
            renderProducts(allProducts, newSort); 
        });
    }

    // --- FUNCTIONS ---

    function updateTitle(category, type) {
        if (!categoryTitle) return;
        
        if (type === 'bestsellers') {
            categoryTitle.textContent = 'Top Selling Products';
        } else if (category) {
            categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        } else {
            categoryTitle.textContent = 'All Products';
        }
    }

    function updateURL(category, sort, type) {
        const newUrl = new URL(window.location);
        
        if (category) newUrl.searchParams.set('category', category);
        else newUrl.searchParams.delete('category');
        
        if (sort && sort !== 'default') newUrl.searchParams.set('sort', sort);
        else newUrl.searchParams.delete('sort');

        if (type) newUrl.searchParams.set('type', type);
        else newUrl.searchParams.delete('type');
        
        window.history.pushState({}, '', newUrl);
    }

    async function fetchAndRenderProducts(category, sortOption, type) {
        let apiUrl = '/api/products';
        const params = [];
        
        if (type) params.push(`type=${encodeURIComponent(type)}`);
        if (category) params.push(`category=${encodeURIComponent(category)}`);
        
        if (params.length > 0) {
            apiUrl += '?' + params.join('&');
        }

        try {
            productGrid.innerHTML = '';
            productGrid.appendChild(loadingText);
            loadingText.style.display = 'block';

            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            
            allProducts = await response.json();
            
            renderProducts(allProducts, sortOption);

        } catch (error) {
            console.error("Error fetching products:", error);
            productGrid.innerHTML = '<p class="error-text">Error loading products. Please try again.</p>';
        }
    }

    function parsePrice(priceStr) {
        if (typeof priceStr !== 'string') return 0;
        return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    }

    function renderProducts(products, sortOption) {
        let sortedProducts = [...products];

        if (sortOption === 'price_asc') {
            sortedProducts.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        } else if (sortOption === 'price_desc') {
            sortedProducts.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        } else if (sortOption === 'name_asc') {
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        }

        productGrid.innerHTML = '';

        if (sortedProducts.length === 0) {
            productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; font-size: 1.2rem; color: #666;">No products found.</p>';
            return;
        }

        sortedProducts.forEach(product => {
            const productCard = document.createElement('product-card');
            product.id = String(product.id);
            productCard.setAttribute('data-product', JSON.stringify(product));
            productGrid.appendChild(productCard);
        });
    }
});