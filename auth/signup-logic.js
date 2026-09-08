// Signup Page JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const signupForm = document.getElementById('signupForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const strengthText = document.getElementById('strengthText');
    const strengthFill = document.getElementById('strengthFill');
    const agreeTermsCheck = document.getElementById('agreeTerms');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const successMessage = document.getElementById('successMessage');
    const successText = document.getElementById('successText');
    const signupBtn = document.getElementById('signupBtn');
    const googleSignupBtn = document.getElementById('googleSignup');
    const facebookSignupBtn = document.getElementById('facebookSignup');
    const roleOptions = document.querySelectorAll('.role-option');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordEyeIcon = document.getElementById('passwordEyeIcon');

    // Read role from URL parameter (e.g. signup.html?role=artist)
    function getRoleFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('role');
    }

    const roleFromURL = getRoleFromURL();
    if (roleFromURL) {
        const roleId = 'role' + roleFromURL.charAt(0).toUpperCase() + roleFromURL.slice(1);
        const roleInput = document.getElementById(roleId);
        if (roleInput) {
            roleInput.checked = true;
            const roleOption = document.querySelector(`.role-option[data-role="${roleFromURL}"]`);
            if (roleOption) {
                roleOption.classList.add('selected');
            }
        }
    }

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle eye icon
            if (type === 'text') {
                passwordEyeIcon.classList.remove('fa-eye');
                passwordEyeIcon.classList.add('fa-eye-slash');
                togglePasswordBtn.setAttribute('aria-label', 'Hide password');
            } else {
                passwordEyeIcon.classList.remove('fa-eye-slash');
                passwordEyeIcon.classList.add('fa-eye');
                togglePasswordBtn.setAttribute('aria-label', 'Show password');
            }
        });
    }

    // Password strength checker
    function checkPasswordStrength(password) {
        let strength = 0;

        if (password.length >= 8) strength += 1;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 1;
        if (password.match(/\d/)) strength += 1;
        if (password.match(/[^a-zA-Z\d]/)) strength += 1;

        let strengthPercent = (strength / 4) * 100;
        let strengthLabel = "";
        let color = "";

        switch (strength) {
            case 0:
            case 1:
                strengthLabel = "Weak";
                color = "#ff6b6b";
                break;
            case 2:
                strengthLabel = "Fair";
                color = "#ffa726";
                break;
            case 3:
                strengthLabel = "Good";
                color = "#51cf66";
                break;
            case 4:
                strengthLabel = "Strong";
                color = "#2E8B57";
                break;
        }

        return { percent: strengthPercent, label: strengthLabel, color: color };
    }

    // Update password strength indicator
    if (passwordInput && strengthFill && strengthText) {
        passwordInput.addEventListener('input', function () {
            const strength = checkPasswordStrength(passwordInput.value);
            strengthFill.style.width = `${strength.percent}%`;
            strengthFill.style.background = strength.color;
            strengthText.textContent = `Password strength: ${strength.label}`;
            strengthText.style.color = strength.color;
        });
    }

    // Show error message
    function showError(message) {
        if (errorText && errorMessage) {
            errorText.textContent = message;
            errorMessage.style.display = 'block';
            if (successMessage) successMessage.style.display = 'none';
            setTimeout(() => { errorMessage.style.display = 'none'; }, 5000);
        }
    }

    // Show success message
    function showSuccess(message) {
        if (successText && successMessage) {
            successText.textContent = message;
            successMessage.style.display = 'block';
            if (errorMessage) errorMessage.style.display = 'none';
        }
    }

    // Validate email format
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Role selection handling
    roleOptions.forEach(option => {
        option.addEventListener('click', function () {
            roleOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            const roleValue = this.getAttribute('data-role');
            const radioInput = document.getElementById('role' + roleValue.charAt(0).toUpperCase() + roleValue.slice(1));
            if (radioInput) radioInput.checked = true;
        });
    });

    // Handle form submission
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const fullName = fullNameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const userRole = document.querySelector('input[name="userRole"]:checked')?.value;

            if (!fullName || fullName.length < 2) {
                showError('Please enter your full name (at least 2 characters)');
                fullNameInput.focus();
                return;
            }

            if (!validateEmail(email)) {
                showError('Please enter a valid email address');
                emailInput.focus();
                return;
            }

            if (password.length < 6) {
                showError('Password must be at least 6 characters long');
                passwordInput.focus();
                return;
            }

            if (!agreeTermsCheck.checked) {
                showError('You must agree to the Terms of Service');
                return;
            }

            if (!userRole) {
                showError('Please select whether you are a Fan or Artist');
                return;
            }

            const originalText = signupBtn.innerHTML;
            signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating Account...';
            signupBtn.disabled = true;

            const payload = {
                name: fullName,
                email: email,
                password: password,
                type: userRole,
                status: 'active'
            };

            fetch('../backend/api/users.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(res => res.json().then(body => ({ ok: res.ok, status: res.status, body })))
                .then(({ ok, status, body }) => {
                    if (!ok || !body.success) {
                        if (status === 409) throw new Error('An account with this email already exists');
                        throw new Error(body.message || 'Failed to create account');
                    }

                    const redirectUrl = userRole === 'artist'
                        ? 'login.html?registered=artist'
                        : 'login.html?registered=fan';

                    showSuccess('Account created successfully! Redirecting to login...');
                    window.location.href = redirectUrl;
                })
                .catch(err => {
                    showError(err.message || 'Error creating account');
                    signupBtn.innerHTML = originalText;
                    signupBtn.disabled = false;
                });
        });
    }

    // Social signups (demo)
    [googleSignupBtn, facebookSignupBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function () {
                const original = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Connecting...';
                this.disabled = true;
                setTimeout(() => {
                    showSuccess('Social signup is disabled for demo. Use the form above.');
                    this.innerHTML = original;
                    this.disabled = false;
                }, 1000);
            });
        }
    });

    // Demo shortcut (Ctrl+Shift+D)
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            if (fullNameInput) fullNameInput.value = 'John Demo';
            if (emailInput) emailInput.value = 'demo@example.com';
            if (passwordInput) {
                passwordInput.value = 'Demo123!';
                passwordInput.dispatchEvent(new Event('input'));
            }
            if (agreeTermsCheck) agreeTermsCheck.checked = true;
            showSuccess('Demo data filled!');
        }
    });
});
