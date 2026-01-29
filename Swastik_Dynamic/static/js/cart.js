document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartContainer = document.getElementById('cart-container');
    const totalItemsEl = document.getElementById('total-items');
    const totalPriceEl = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    // Get dynamic phone number from the template (or default if missing)
    const shopData = document.getElementById('checkout-btn');
    const shopPhone = shopData ? shopData.getAttribute('data-phone') : '919002066361';

    // Load Cart
    let cart = JSON.parse(localStorage.getItem('swastik_cart')) || [];

    renderCart();

    function renderCart() {
        if (cart.length === 0) {
            cartContainer.style.display = 'none';
            emptyCartMessage.style.display = 'flex';
            return;
        }

        cartContainer.style.display = 'grid'; // Restore grid layout
        emptyCartMessage.style.display = 'none';
        cartItemsContainer.innerHTML = '';
        
        let totalQty = 0;
        let totalPrice = 0;

        cart.forEach((item, index) => {
            totalQty += item.quantity;
            const itemPrice = parsePrice(item.price) * item.quantity;
            totalPrice += itemPrice;

            const itemEl = document.createElement('div');
            itemEl.classList.add('cart-item');
            itemEl.innerHTML = `
                <div class="item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-price">${item.price}</p>
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="qty-btn minus" data-index="${index}">-</button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn plus" data-index="${index}">+</button>
                    </div>
                    <button class="remove-btn" data-index="${index}">
                        <i class="material-icons">delete</i>
                    </button>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });

        // Update Summary
        totalItemsEl.textContent = totalQty;
        totalPriceEl.textContent = `₹${totalPrice.toLocaleString()}`;
    }

    function parsePrice(priceStr) {
        // Remove currency symbols, commas, etc.
        // "₹25,000" -> 25000
        if (!priceStr) return 0;
        return parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    }

    // Handle Clicks (Increase, Decrease, Remove)
    cartItemsContainer.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.classList.contains('plus') || target.closest('.plus')) {
            const index = (target.classList.contains('plus') ? target : target.closest('.plus')).dataset.index;
            cart[index].quantity++;
            saveAndRender();
        } 
        else if (target.classList.contains('minus') || target.closest('.minus')) {
            const index = (target.classList.contains('minus') ? target : target.closest('.minus')).dataset.index;
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
            } else {
                // If 1, ask to remove or just remove
                cart.splice(index, 1);
            }
            saveAndRender();
        } 
        else if (target.classList.contains('remove-btn') || target.closest('.remove-btn')) {
            const index = (target.classList.contains('remove-btn') ? target : target.closest('.remove-btn')).dataset.index;
            cart.splice(index, 1);
            saveAndRender();
        }
    });

    function saveAndRender() {
        localStorage.setItem('swastik_cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('cartUpdated')); // Update nav counter
        renderCart();
    }

    // Checkout Logic
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) return;

            let message = "Hello, I would like to place an order for the following items:\n\n";
            let grandTotal = 0;

            cart.forEach((item, i) => {
                const itemTotal = parsePrice(item.price) * item.quantity;
                grandTotal += itemTotal;
                message += `${i + 1}. ${item.name}\n   Qty: ${item.quantity} | Price: ${item.price}\n`;
            });

            message += `\n*Total Estimate: ₹${grandTotal.toLocaleString()}*`;
            message += "\n\nPlease confirm availability and delivery charges.";

            const whatsappUrl = `https://wa.me/${shopPhone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        });
    }
});