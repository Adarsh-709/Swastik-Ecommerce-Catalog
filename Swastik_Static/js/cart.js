import { shopSettings } from "./data.js";

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartContainer = document.getElementById('cart-container');
    const totalItemsEl = document.getElementById('total-items');
    const totalPriceEl = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Get phone from shopSettings (from data.js via common.js scope or direct)
    const shopPhone = (typeof shopSettings !== 'undefined' && shopSettings.phone) ? shopSettings.phone : '0000000000';

    // Helper to safely parse price
    function getPrice(price) {
        if (!price) return 0;
        // If it's already a number, return it
        if (typeof price === 'number') return price;
        
        // Convert to string, remove non-numeric chars except dot
        // Handles "₹25,000", "25,000", "Rs. 25000", etc.
        const clean = String(price).replace(/[^0-9.]/g, '');
        const num = parseFloat(clean);
        return isNaN(num) ? 0 : num;
    }

    // Load Cart function to ensure fresh data
    function loadCart() {
        return JSON.parse(localStorage.getItem('swastik_cart')) || [];
    }

    let cart = loadCart();

    // Initial Render
    renderCart();

    // Listen for storage changes from other tabs
    window.addEventListener('storage', () => {
        cart = loadCart();
        renderCart();
    });

    function renderCart() {
        // Refresh cart from memory/storage to be safe
        // cart = loadCart(); // Optional: usually managed by actions

        if (cart.length === 0) {
            if(cartContainer) cartContainer.style.display = 'none';
            if(emptyCartMessage) emptyCartMessage.style.display = 'flex';
            return;
        }

        if(cartContainer) cartContainer.style.display = 'grid'; 
        if(emptyCartMessage) emptyCartMessage.style.display = 'none';
        if(cartItemsContainer) cartItemsContainer.innerHTML = '';
        
        let totalQty = 0;
        let totalPrice = 0;

        cart.forEach((item, index) => {
            const qty = (item.quantity && item.quantity > 0) ? parseInt(item.quantity) : 1;
            totalQty += qty;
            
            const priceNum = getPrice(item.price);
            const itemTotal = priceNum * qty;
            totalPrice += itemTotal;

            if (cartItemsContainer) {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                
                cartItem.innerHTML = `
                    <div class="item-image">
                        <img src="${item.image || ''}" alt="${item.name || 'Product'}">
                    </div>
                    <div class="item-details">
                        <h3 class="item-name">${item.name || 'Unknown Product'}</h3>
                        <p class="item-price">${item.price || '₹0'}</p>
                    </div>
                    <div class="item-controls">
                        <div class="quantity-control">
                            <button class="qty-btn" data-action="decrease" data-index="${index}">-</button>
                            <span class="item-qty">${qty}</span>
                            <button class="qty-btn" data-action="increase" data-index="${index}">+</button>
                        </div>
                        <button class="remove-btn" data-index="${index}" aria-label="Remove item">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItem);
            }
        });

        // Update Totals
        if(totalItemsEl) totalItemsEl.textContent = totalQty;
        if(totalPriceEl) {
            // Ensure locale string works, fallback to simple string if needed
            try {
                totalPriceEl.textContent = '₹' + totalPrice.toLocaleString('en-IN');
            } catch (e) {
                totalPriceEl.textContent = '₹' + totalPrice;
            }
        }
    }

    // Event Delegation for Controls
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            // Handle Quantity Buttons
            if (target.classList.contains('qty-btn')) {
                const index = parseInt(target.dataset.index);
                const action = target.dataset.action;

                if (action === 'increase') {
                    cart[index].quantity = (cart[index].quantity || 0) + 1;
                } else if (action === 'decrease') {
                    cart[index].quantity = (cart[index].quantity || 0) - 1;
                    if (cart[index].quantity <= 0) {
                        cart.splice(index, 1);
                    }
                }
                saveAndRender();
            } 
            // Handle Remove Button
            else if (target.classList.contains('remove-btn') || target.closest('.remove-btn')) {
                const btn = target.classList.contains('remove-btn') ? target : target.closest('.remove-btn');
                const index = parseInt(btn.dataset.index);
                cart.splice(index, 1);
                saveAndRender();
            }
        });
    }

    function saveAndRender() {
        localStorage.setItem('swastik_cart', JSON.stringify(cart));
        
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
        window.dispatchEvent(new Event('cartUpdated')); 
        
        renderCart();
    }

    // Checkout Logic
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;

            let message = "Hello, I would like to place an order for the following items:\n\n";
            let grandTotal = 0;

            cart.forEach((item, i) => {
                const priceNum = getPrice(item.price);
                const qty = item.quantity || 1;
                const itemTotal = priceNum * qty;
                grandTotal += itemTotal;
                message += `${i + 1}. ${item.name || 'Item'}\n   Qty: ${qty} | Price: ${item.price || '₹0'}\n`;
            });

            // Ensure locale string works here too
            let totalString = '0';
            try {
                totalString = grandTotal.toLocaleString('en-IN');
            } catch (e) {
                totalString = grandTotal.toString();
            }

            message += `\n*Total Estimate: ₹${totalString}*`;
            message += "\n\nPlease confirm availability and delivery charges.";

            const whatsappUrl = `https://wa.me/${shopPhone}?text=${encodeURIComponent(message)}`;
            
            window.open(whatsappUrl, '_blank');
        });
    }
});