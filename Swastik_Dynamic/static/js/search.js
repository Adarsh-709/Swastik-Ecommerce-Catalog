document.addEventListener('DOMContentLoaded', async () => {
    const searchResultsTitle = document.getElementById('search-results-title');
    const searchResultsGrid = document.getElementById('search-results-grid');
    const loadingText = document.querySelector('.loading-text');

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');

    if (searchQuery) {
        searchResultsTitle.textContent = `Search Results for "${searchQuery}"`;
        
        try {
            // Fetch filtered results from backend API
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const products = await response.json();

            // Clear loading text
            if(loadingText) loadingText.remove();

            if (products.length === 0) {
                searchResultsGrid.innerHTML = '<p>No products found matching your search.</p>';
                return;
            }

            // Display results
            products.forEach(product => {
                const productCard = document.createElement('product-card');
                productCard.setAttribute('data-product', JSON.stringify(product));
                searchResultsGrid.appendChild(productCard);
            });

        } catch (error) {
            console.error("Error searching products: ", error);
            if(loadingText) loadingText.textContent = "An error occurred while searching.";
        }

    } else {
        searchResultsTitle.textContent = 'Please enter a search query.';
        if(loadingText) loadingText.textContent = "";
    }
});