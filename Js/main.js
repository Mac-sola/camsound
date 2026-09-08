// Main JavaScript for Landing Page

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Bootstrap components
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background on scroll
    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(10, 10, 10, 0.95)';
            navbar.style.padding = '0.5rem 0';
        } else {
            navbar.style.backgroundColor = 'rgba(10, 10, 10, 0.9)';
            navbar.style.padding = '1rem 0';
        }
    });

    // Animation for vinyl record
    const vinyl = document.querySelector('.vinyl-record');
    if (vinyl) {
        vinyl.style.animationPlayState = 'paused';

        vinyl.addEventListener('mouseenter', function () {
            this.style.animationPlayState = 'running';
        });

        vinyl.addEventListener('mouseleave', function () {
            this.style.animationPlayState = 'paused';
        });
    }

    // Newsletter form submission
    const newsletterForm = document.querySelector('.footer form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            if (!email) {
                window.afro.showNotification('Please enter your email address.', 'warning');
                emailInput.focus();
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                window.afro.showNotification('Please enter a valid email address.', 'warning');
                emailInput.focus();
                return;
            }
            window.afro.showNotification('Thank you for subscribing to our newsletter!', 'success');
            emailInput.value = '';
        });
    }

    // Pricing card hover effect enhancement
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            if (!this.classList.contains('popular')) {
                this.style.borderColor = 'var(--primary-color)';
            }
        });

        card.addEventListener('mouseleave', function () {
            if (!this.classList.contains('popular')) {
                this.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            }
        });
    });
});