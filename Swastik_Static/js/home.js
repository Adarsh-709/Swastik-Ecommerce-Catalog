import { products } from "./data.js";

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. HERO CAROUSEL LOGIC ---
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    
    if (slides.length > 0) {
        let currentSlide = 0;
        const totalSlides = slides.length;
        let slideInterval;

        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            currentSlide = (index + totalSlides) % totalSlides;
            
            slides[currentSlide].classList.add('active');
            if(dots[currentSlide]) dots[currentSlide].classList.add('active');
        }

        function nextSlide() { showSlide(currentSlide + 1); }
        function prevSlide() { showSlide(currentSlide - 1); }

        function startCarousel() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000); 
        }

        if(nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startCarousel(); });
        if(prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startCarousel(); });
        
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => { showSlide(index); startCarousel(); });
        });

        // Touch Swipe Logic for Hero Carousel
        const carouselContainer = document.querySelector('.carousel-container');
        let touchStartX = 0;
        let touchEndX = 0;

        if (carouselContainer) {
            carouselContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                clearInterval(slideInterval); // Pause on touch
            }, { passive: true });

            carouselContainer.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleCarouselSwipe();
                startCarousel(); // Resume after touch
            }, { passive: true });
        }

        function handleCarouselSwipe() {
            if (touchEndX < touchStartX - 50) {
                nextSlide(); // Swipe Left -> Next
            }
            if (touchEndX > touchStartX + 50) {
                prevSlide(); // Swipe Right -> Prev
            }
        }

        startCarousel();
    }

    // --- 2. BESTSELLERS LOGIC ---
    const bestsellersGrid = document.getElementById('bestsellers-grid');
    const bsPrevBtn = document.querySelector('.bestsellers-container .prev-btn');
    const bsNextBtn = document.querySelector('.bestsellers-container .next-btn');

    if (bestsellersGrid && typeof products !== 'undefined') {
        const bestsellers = products.filter(p => p.bestseller);
        bestsellersGrid.innerHTML = '';

        if (bestsellers.length === 0) {
            bestsellersGrid.innerHTML = '<p style="text-align:center; width:100%; padding:20px;">No bestsellers found.</p>';
        } else {
            bestsellers.forEach(product => {
                // Price Calculation
                const currentPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
                let priceDisplayHtml = `<span class="current-price">${product.price}</span>`;
                if (product.original_price) {
                    const originalPrice = parseFloat(product.original_price.replace(/[^0-9.]/g, ''));
                    if (originalPrice > currentPrice) {
                        const percentOff = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
                        priceDisplayHtml = `
                            <div class="price-row">
                                <span class="original-price">${product.original_price}</span>
                                <span class="current-price">${product.price}</span>
                            </div>
                            <div class="discount-row">
                                <span class="discount-percent">(${percentOff}% OFF)</span>
                            </div>
                        `;
                    }
                }

                const card = document.createElement('a');
                card.href = `product.html?id=${product.id}`;
                card.className = 'bestseller-card'; 
                card.innerHTML = `
                    <div class="limited-deal-badge">Limited Time Deal</div>
                    <div class="image-wrapper"><img src="${product.image}" alt="${product.name}" loading="lazy"></div>
                    <div class="info-wrapper">
                        <h4>${product.name}</h4>
                        <div class="price-container">${priceDisplayHtml}</div>
                        <span class="btn-text">View Details <i class="fas fa-arrow-right"></i></span>
                    </div>
                `;
                bestsellersGrid.appendChild(card);
            });
        }

        // Auto Slide Logic for Bestsellers
        let bsInterval;
        const scrollBestseller = (direction) => {
            const cardWidth = bestsellersGrid.clientWidth; 
            if (direction === 'next') {
                if (bestsellersGrid.scrollLeft + bestsellersGrid.clientWidth >= bestsellersGrid.scrollWidth - 10) {
                    bestsellersGrid.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    bestsellersGrid.scrollBy({ left: cardWidth, behavior: 'smooth' });
                }
            } else {
                bestsellersGrid.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            }
        };

        const startBsAuto = () => {
            clearInterval(bsInterval);
            bsInterval = setInterval(() => scrollBestseller('next'), 4000); 
        };

        if (bsNextBtn && bsPrevBtn) {
            bsNextBtn.addEventListener('click', () => { scrollBestseller('next'); startBsAuto(); });
            bsPrevBtn.addEventListener('click', () => { scrollBestseller('prev'); startBsAuto(); });
        }
        
        startBsAuto();
        bestsellersGrid.addEventListener('mouseenter', () => clearInterval(bsInterval));
        bestsellersGrid.addEventListener('mouseleave', startBsAuto);
        bestsellersGrid.addEventListener('touchstart', () => clearInterval(bsInterval), { passive: true });
        bestsellersGrid.addEventListener('touchend', startBsAuto, { passive: true });
    }

    // --- 3. LATEST PRODUCTS LOGIC (UPDATED) ---
    const latestGrid = document.getElementById('latest-products-grid');

    if (latestGrid && typeof products !== 'undefined') {
        // Filter specifically for products marked as 'latest_arrival: true'
        let latestProducts = products.filter(p => p.latest_arrival === true);

        // Fallback: If no products are marked, show the last 8 added (optional safety)
        if (latestProducts.length === 0) {
            // console.warn("No products marked as 'latest_arrival'. Showing most recent items.");
            latestProducts = [...products].reverse().slice(0, 8);
        } else {
            // If explicit items exist, limit to 8
            latestProducts = latestProducts.slice(0, 8);
        }

        latestGrid.innerHTML = '';

        if (latestProducts.length === 0) {
            latestGrid.innerHTML = '<p style="text-align:center; width:100%; padding:20px;">No latest products found.</p>';
        } else {
            latestProducts.forEach(product => {
                const card = document.createElement('a');
                card.href = `product.html?id=${product.id}`;
                card.className = 'latest-card'; 
                
                card.innerHTML = `
                    <div class="image-box">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        ${product.latest_arrival ? '<span style="position:absolute;top:10px;left:10px;background:#333;color:white;padding:2px 6px;font-size:0.7rem;border-radius:3px;">NEW</span>' : ''}
                    </div>
                    <div class="details-box">
                        <h4>${product.name}</h4>
                        <p class="price">${product.price}</p>
                    </div>
                `;
                latestGrid.appendChild(card);
            });
        }
    }
});