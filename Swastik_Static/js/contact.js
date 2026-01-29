import { shopSettings } from "./data.js";

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic Map Injection (if URL is in data.js)
    const mapIframe = document.getElementById('google-map');
    if (mapIframe && typeof shopSettings !== 'undefined' && shopSettings.mapUrl) {
        mapIframe.src = shopSettings.mapUrl_embed;
    }

    // 2. Form Handling
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;

            // Basic validation
            if (!name || !phone || !message) {
                alert('Please fill in all fields.');
                return;
            }

            // Construct WhatsApp Message
            // "%0a" is a line break for URL encoding
            const whatsappText = `*New Inquiry from Website* %0a%0a` +
                                 `*Name:* ${name} %0a` +
                                 `*Phone:* ${phone} %0a` +
                                 `*Message:* ${message}`;

            // Use shopSettings phone if available, else default
            const phoneNumber = (typeof shopSettings !== 'undefined' && shopSettings.phone) ? shopSettings.phone : '919002066361';
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappText}`;

            // Open WhatsApp
            window.open(whatsappUrl, '_blank');

            // Reset form
            contactForm.reset();
        });
    }
});