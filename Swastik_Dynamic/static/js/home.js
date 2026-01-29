document.addEventListener('DOMContentLoaded', async () => {
    const bestsellersGrid = document.querySelector('.bestsellers-grid');
    const loadingText = document.querySelector('.loading-text');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    // --- HERO CAROUSEL LOGIC ---
    initCarousel();

    function initCarousel() {
        const carouselContainer = document.querySelector('.hero-carousel'); // Get container for touch events
        const slides = document.querySelectorAll('.carousel-slide');
        const dots = document.querySelectorAll('.dot');
        const prev = document.querySelector('.carousel-btn.prev');
        const next = document.querySelector('.carousel-btn.next');
        
        let currentSlide = 0;
        const totalSlides = slides.length;
        let slideInterval;

        // Touch handling variables
        let touchStartX = 0;
        let touchEndX = 0;

        // Ensure we have slides before proceeding
        if (slides.length === 0) return;

        function showSlide(index) {
            // Remove active class from all
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            // Handle index wrapping
            if (index >= totalSlides) currentSlide = 0;
            else if (index < 0) currentSlide = totalSlides - 1;
            else currentSlide = index;

            // Activate new slide
            slides[currentSlide].classList.add('active');
            if (dots[currentSlide]) dots[currentSlide].classList.add('active');
        }

        function nextSlide() {
            showSlide(currentSlide + 1);
        }

        function prevSlide() {
            showSlide(currentSlide - 1);
        }

        // Event Listeners
        if (next) next.addEventListener('click', () => {
            nextSlide();
            resetTimer();
        });

        if (prev) prev.addEventListener('click', () => {
            prevSlide();
            resetTimer();
        });

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const slideIndex = parseInt(e.target.dataset.slide);
                showSlide(slideIndex);
                resetTimer();
            });
        });

        // --- TOUCH EVENTS FOR MOBILE SLIDING ---
        if (carouselContainer) {
            carouselContainer.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                // Pause auto-slide on touch start
                clearInterval(slideInterval);
            }, { passive: true });

            carouselContainer.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
                // Restart auto-slide after interaction
                resetTimer();
            }, { passive: true });
        }

        function handleSwipe() {
            const threshold = 50; // Minimum swipe distance
            if (touchEndX < touchStartX - threshold) {
                // Swiped Left -> Next Slide
                nextSlide();
            } else if (touchEndX > touchStartX + threshold) {
                // Swiped Right -> Previous Slide
                prevSlide();
            }
        }

        // Auto Play
        function startTimer() {
            slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
        }

        function resetTimer() {
            clearInterval(slideInterval);
            startTimer();
        }

        startTimer();
    }

    // --- BESTSELLERS LOGIC ---
    if (bestsellersGrid) {
        try {
            // Fetch data from the Flask API
            const response = await fetch('/api/bestsellers');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const products = await response.json();

            // Clear loading text
            if(loadingText) loadingText.remove();

            if (products.length === 0) {
                bestsellersGrid.innerHTML = '<p style="text-align:center; width:100%;">No bestsellers found.</p>';
            } else {
                // Group by Category and pick one best seller per category
                const uniqueCategoryProducts = {};
                products.forEach(product => {
                    // If we haven't seen this category yet, add it
                    if (product.category && !uniqueCategoryProducts[product.category]) {
                        uniqueCategoryProducts[product.category] = product;
                    }
                });

                const uniqueProducts = Object.values(uniqueCategoryProducts);

                if (uniqueProducts.length === 0) {
                     // Fallback: If no categories defined, just show top products
                     products.slice(0, 5).forEach(createCard);
                } else {
                    uniqueProducts.forEach(createCard);
                }

                function createCard(product) {
                    const productCard = document.createElement('bestseller-card');
                    product.id = String(product.id);
                    productCard.setAttribute('data-product', JSON.stringify(product));
                    bestsellersGrid.appendChild(productCard);
                }

                // Start the Auto-Sliding Effect and setup manual controls
                setupSlider(bestsellersGrid, prevBtn, nextBtn);
            }
            
        } catch (error) {
            console.error("Error fetching bestsellers: ", error);
            if(loadingText) loadingText.textContent = "Unable to load products. Please check your connection.";
        }
    }

    /**
     * Function to handle the auto-sliding carousel effect and manual controls
     */
    function setupSlider(element, prev, next) {
        let scrollInterval;
        const speed = 3500; // Slide every 3.5 seconds

        const nextSlide = () => {
            const itemWidth = element.clientWidth; 
            const maxScroll = element.scrollWidth - element.clientWidth;
            
            if (element.scrollLeft >= maxScroll - 5) {
                element.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                element.scrollBy({ left: itemWidth, behavior: 'smooth' });
            }
        };

        const prevSlide = () => {
            const itemWidth = element.clientWidth;
            
            if (element.scrollLeft <= 5) {
                element.scrollTo({ left: element.scrollWidth, behavior: 'smooth' });
            } else {
                element.scrollBy({ left: -itemWidth, behavior: 'smooth' });
            }
        };

        const startAuto = () => {
            clearInterval(scrollInterval);
            scrollInterval = setInterval(nextSlide, speed);
        };

        const stopAuto = () => {
            clearInterval(scrollInterval);
        };

        // Start auto slide
        startAuto();

        // Manual Controls
        if (next) {
            next.addEventListener('click', () => {
                nextSlide();
                stopAuto();
                // Restart auto slide after 5 seconds of inactivity
                setTimeout(startAuto, 5000); 
            });
        }

        if (prev) {
            prev.addEventListener('click', () => {
                prevSlide();
                stopAuto();
                setTimeout(startAuto, 5000);
            });
        }

        // Pause on interaction
        element.addEventListener('mouseenter', stopAuto);
        element.addEventListener('touchstart', stopAuto);

        element.addEventListener('mouseleave', startAuto);
        element.addEventListener('touchend', startAuto);
    }
});