document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;

            // Basic validation (HTML 'required' attribute handles most)
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

            const phoneNumber = '919002066361'; // Your number
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappText}`;

            // Open WhatsApp
            window.open(whatsappUrl, '_blank');

            // Optional: Reset form
            contactForm.reset();
        });
    }
});