document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const colorQuantities = {
        red: 0,
        blue: 0,
        yellow: 0,
        green: 0
    };
    const basePrice = 4.99;
    const whatsappNumber = "96176117811"; // Updated WhatsApp number with country code
    const colorNames = {
        red: 'Red',
        blue: 'Blue',
        yellow: 'Yellow',
        green: 'Green'
    };
    const colorThemes = {
        red: { color: '#e74c3c', rgb: '231, 76, 60' },
        blue: { color: '#3498db', rgb: '52, 152, 219' },
        yellow: { color: '#f1c40f', rgb: '241, 196, 15' },
        green: { color: '#2ecc71', rgb: '46, 204, 113' }
    };

    // Handle quantity adjustments
    const quantityInputs = document.querySelectorAll('.color-quantity');
    const quantityButtons = document.querySelectorAll('.quantity-btn');
    
    // Set up quantity button listeners
    quantityButtons.forEach(button => {
        button.addEventListener('click', function() {
            const color = this.getAttribute('data-color');
            const action = this.getAttribute('data-action');
            const input = document.getElementById(`${color}Quantity`);
            let value = parseInt(input.value);
            
            if (action === 'increase' && value < 10) {
                value++;
            } else if (action === 'decrease' && value > 0) {
                value--;
            }
            
            input.value = value;
            colorQuantities[color] = value;
            updateOrderSummary();
        });
    });
    
    // Set up direct input changes
    quantityInputs.forEach(input => {
        input.addEventListener('change', function() {
            const color = this.getAttribute('data-color');
            let value = parseInt(this.value);
            
            // Enforce min and max
            if (isNaN(value) || value < 0) {
                value = 0;
            } else if (value > 10) {
                value = 10;
            }
            
            this.value = value;
            colorQuantities[color] = value;
            updateOrderSummary();
        });
    });
    
    // Function to update the order summary
    function updateOrderSummary() {
        const summaryItemsContainer = document.getElementById('summaryItems');
        const totalQuantityElement = document.getElementById('totalQuantity');
        const discountAppliedElement = document.getElementById('discountApplied');
        const subtotalPriceElement = document.getElementById('subtotalPrice');
        const totalPriceElement = document.getElementById('totalPrice');
        
        // Delivery fee constant
        const deliveryFee = 3.99;
        
        // Calculate total quantity
        const totalQuantity = Object.values(colorQuantities).reduce((sum, qty) => sum + qty, 0);
        totalQuantityElement.textContent = totalQuantity;
        
        // Apply discount based on total quantity
        let discount = 0;
        if (totalQuantity >= 3) {
            discount = 0.2; // 20% discount
            discountAppliedElement.textContent = '20% OFF';
            discountAppliedElement.className = 'text-success fw-bold';
        } else {
            discountAppliedElement.textContent = 'None';
            discountAppliedElement.className = '';
        }
        
        // Calculate subtotal with discount
        const discountedUnitPrice = basePrice * (1 - discount);
        const subtotal = (discountedUnitPrice * totalQuantity).toFixed(2);
        subtotalPriceElement.textContent = `$${subtotal}`;
        
        // Calculate total price (subtotal + delivery fee)
        const totalPrice = totalQuantity > 0 ? (parseFloat(subtotal) + deliveryFee).toFixed(2) : '0.00';
        totalPriceElement.textContent = `$${totalPrice}`;
        
        // Update summary items
        if (totalQuantity === 0) {
            summaryItemsContainer.innerHTML = '<p class="text-muted text-center">Add products to your cart</p>';
        } else {
            let summaryHTML = '';
            
            for (const color in colorQuantities) {
                if (colorQuantities[color] > 0) {
                    const itemPrice = (discountedUnitPrice * colorQuantities[color]).toFixed(2);
                    summaryHTML += `
                        <div class="summary-item">
                            <div>
                                <span class="summary-color-indicator" style="background-color: ${colorThemes[color].color}"></span>
                                ${colorNames[color]} × ${colorQuantities[color]}
                            </div>
                            <div>$${itemPrice}</div>
                        </div>
                    `;
                }
            }
            
            summaryItemsContainer.innerHTML = summaryHTML;
        }
        
        // Update total visibility based on quantity
        if (totalQuantity > 0) {
            document.querySelector('.order-summary').classList.remove('d-none');
        } else {
            document.querySelector('.order-summary').classList.add('d-none');
        }
    }

    // Handle form submission with WhatsApp redirect
    const purchaseForm = document.getElementById('confirmPurchase');
    const customerName = document.getElementById('customerName');
    const customerPhone = document.getElementById('customerPhone');
    const customerAddress = document.getElementById('customerAddress');
    const purchaseModal = new bootstrap.Modal(document.getElementById('purchaseModal'));

    purchaseForm.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Delivery fee constant
        const deliveryFee = 3.99;
        
        // Calculate total quantity
        const totalQuantity = Object.values(colorQuantities).reduce((sum, qty) => sum + qty, 0);
        
        // Form validation
        if (totalQuantity === 0) {
            alert('Please select at least one product.');
            return;
        }
        
        if (!customerName.value || !customerPhone.value || !customerAddress.value) {
            alert('Please fill in all the required fields.');
            return;
        }
        
        // Get selected payment method
        let paymentMethod = "Cash on Delivery";
        if (document.getElementById('whishMoney').checked) {
            paymentMethod = "Whish Money";
        } else if (document.getElementById('omt').checked) {
            paymentMethod = "OMT";
        }
        
        // Calculate discount based on total quantity
        let discount = 0;
        if (totalQuantity >= 3) {
            discount = 0.2; // 20% discount
        }
        
        const discountedUnitPrice = basePrice * (1 - discount);
        const subtotal = (discountedUnitPrice * totalQuantity).toFixed(2);
        const totalPrice = (parseFloat(subtotal) + deliveryFee).toFixed(2);
        
        // Create color order details
        let orderDetails = '';
        for (const color in colorQuantities) {
            if (colorQuantities[color] > 0) {
                orderDetails += `- ${colorNames[color]}: ${colorQuantities[color]} units\n`;
            }
        }
        
        // Create WhatsApp message
        const message = 
            `Hello! I'd like to order Wipe the Blur:\n\n` +
            `Name: ${customerName.value}\n` +
            `Phone: ${customerPhone.value}\n` +
            `Address: ${customerAddress.value}\n\n` +
            `Order Details:\n` +
            `${orderDetails}` +
            `Total Quantity: ${totalQuantity}\n` +
            `Subtotal: $${subtotal}\n` +
            `Delivery Fee: $3.99 (All over Lebanon)\n` +
            `Total Price: $${totalPrice}\n` +
            `Payment: ${paymentMethod}\n\n` +
            `Thank you!`;
        
        // Encode message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Create WhatsApp URL
        const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        // Hide purchase modal
        purchaseModal.hide();
        
        // Open WhatsApp in new tab
        window.open(whatsappURL, '_blank');
        
        // Reset form and quantities
        document.querySelectorAll('input[type=text], input[type=tel], textarea').forEach(input => {
            input.value = '';
        });
        
        // Reset color quantities
        quantityInputs.forEach(input => {
            input.value = 0;
            const color = input.getAttribute('data-color');
            colorQuantities[color] = 0;
        });
    });

    // Initialize when modal is shown
    document.getElementById('purchaseModal').addEventListener('show.bs.modal', function () {
        // Reset all quantities to 0 if not already set
        quantityInputs.forEach(input => {
            input.value = colorQuantities[input.getAttribute('data-color')];
        });
        
        // Update order summary
        updateOrderSummary();
    });

    // Navbar scroll behavior
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.style.padding = '10px 0';
            navbar.style.backgroundColor = 'rgba(44, 62, 80, 0.95)';
        } else {
            navbar.style.padding = '20px 0';
            navbar.style.backgroundColor = 'var(--secondary-color)';
        }
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add animation to elements when they come into view
    const animateElements = document.querySelectorAll('.pricing-content, .hero h1, .hero p, .hero-buttons, .feature-card, .review-card, .step-card');
    
    function checkScroll() {
        const triggerBottom = window.innerHeight / 5 * 4;
        
        animateElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerBottom) {
                element.classList.add('fadeInUp');
            }
        });
    }
    
    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Check on initial load

    // Initialize order summary
    updateOrderSummary();
});

// Initialize tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
}); 