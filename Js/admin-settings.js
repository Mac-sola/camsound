/**
 * AfroRhythm Admin Settings JavaScript
 * Handles loading and saving platform settings
 */

document.addEventListener('DOMContentLoaded', function () {
    console.log('⚙️ Admin Settings Initializing...');

    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // Map of setting keys (backend) to input IDs (frontend)
    const settingsMap = {
        'platform_name': 'platformName',
        'platform_description': 'platformDesc',
        'contact_email': 'contactEmail',
        'maintenance_mode': 'maintenanceMode',
        'auto_approve_artists': 'artistAutoApprove',
        'auto_approve_songs': 'songAutoApprove',
        'max_upload_size': 'maxUploadSize',
        'currency': 'currency',
        'payment_mode': 'paymentMode',
        'smtp_host': 'smtpHost',
        'smtp_port': 'smtpPort'
    };

    // Load settings from API
    async function loadSettings() {
        console.log('📥 Loading platform settings...');
        try {
            const result = await window.afro.safeFetch('backend/api/admin.php?action=settings');

            const settings = result.data;

            // Populate inputs
            for (const [key, inputId] of Object.entries(settingsMap)) {
                const input = document.getElementById(inputId);
                if (input && settings[key] !== undefined) {
                    if (input.type === 'checkbox') {
                        input.checked = (settings[key] === '1' || settings[key] === true || settings[key] === 'true');
                    } else {
                        input.value = settings[key];
                    }
                    console.log(`✅ Loaded ${key}: ${settings[key]}`);
                }
            }
            console.log('✨ Settings loaded successfully');
        } catch (error) {
            console.error('❌ Error loading settings:', error);
        }
    }

    // Save settings to API
    async function saveSettings() {
        console.log('📤 Saving platform settings...');

        // Show loading state
        const originalBtnText = saveSettingsBtn.innerHTML;
        saveSettingsBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${t('Saving...')}`;
        saveSettingsBtn.disabled = true;

        const data = {};
        for (const [key, inputId] of Object.entries(settingsMap)) {
            const input = document.getElementById(inputId);
            if (input) {
                if (input.type === 'checkbox') {
                    data[key] = input.checked ? '1' : '0';
                } else {
                    data[key] = input.value;
                }
            }
        }

        try {
            const result = await window.afro.safeFetch('backend/api/admin.php?action=settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            showFeedback('Settings saved successfully!', 'success');
            console.log('✅ Settings saved successfully');

            // Trigger global branding refresh
            if (window.PLATFORM_SETTINGS && data.platform_name) {
                window.PLATFORM_SETTINGS.name = data.platform_name;
                if (window.refreshPlatformBranding) window.refreshPlatformBranding();
            }
        } catch (error) {
            showFeedback('Error saving settings. Please try again.', 'danger');
            console.error('❌ Error saving settings:', error);
        } finally {
            saveSettingsBtn.innerHTML = originalBtnText;
            saveSettingsBtn.disabled = false;
        }
    }

    // Show feedback alert
    function showFeedback(message, type) {
        // Find or create feedback container
        let feedbackContainer = document.getElementById('settingsFeedback');
        if (!feedbackContainer) {
            feedbackContainer = document.createElement('div');
            feedbackContainer.id = 'settingsFeedback';
            feedbackContainer.className = 'mt-3';
            saveSettingsBtn.parentElement.appendChild(feedbackContainer);
        }

        feedbackContainer.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
        `;

        // Auto-hide after 5 seconds
        setTimeout(() => {
            const alert = bootstrap.Alert.getInstance(feedbackContainer.querySelector('.alert'));
            if (alert) alert.close();
        }, 5000);
    }

    // Event Listeners
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSettings);
    }

    // Initialize
    loadSettings();
});
